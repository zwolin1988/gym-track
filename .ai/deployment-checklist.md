# Deployment Checklist - Exercises API

## Pre-Deployment Verification

### ✅ Code Quality

- [x] TypeScript compilation passes (`npm run build`)
- [x] All ESLint checks pass (`npm run lint`)
- [x] Code formatted with Prettier
- [x] No console errors in production build
- [ ] All TODO comments resolved or tracked
- [ ] Code reviewed by team member

### ✅ Database Setup

**Supabase Dashboard Verification:**

#### 1. Tables Exist
- [ ] `categories` table created
- [ ] `exercises` table created
- [ ] Verify table structure matches `database.types.ts`

#### 2. Row Level Security (RLS) Enabled

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'exercises');
```

Expected result: `rowsecurity = true` for both tables

#### 3. RLS Policies Created

**Categories Policy:**
```sql
-- Check if policy exists
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'categories';
```

Expected policy:
- Name: `Allow authenticated users to read categories`
- Command: `SELECT`
- Using: `true`

**Exercises Policy:**
```sql
-- Check if policy exists
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'exercises';
```

Expected policy:
- Name: `Allow authenticated users to read exercises`
- Command: `SELECT`
- Using: `true`

#### 4. Indexes Exist

```sql
-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('categories', 'exercises')
ORDER BY tablename, indexname;
```

**Required indexes:**

Categories:
- [ ] `categories_pkey` (PRIMARY KEY on id)
- [ ] `idx_categories_slug` (on slug)
- [ ] `idx_categories_order_index` (on order_index)

Exercises:
- [ ] `exercises_pkey` (PRIMARY KEY on id)
- [ ] `idx_exercises_category` (on category_id)
- [ ] `idx_exercises_difficulty` (on difficulty)
- [ ] `idx_exercises_name_gin` (GIN index for search)

**Create missing indexes if needed:**

```sql
-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON categories(order_index);

-- Exercises indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);

-- GIN index for full-text search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_exercises_name_gin ON exercises USING GIN(name gin_trgm_ops);
```

#### 5. Seed Data

- [ ] At least 5 categories in `categories` table
- [ ] At least 50 exercises in `exercises` table
- [ ] All exercises have valid `category_id` (foreign key)
- [ ] All difficulty values are valid (`easy`, `medium`, `hard`)

**Verify data:**

```sql
-- Count categories
SELECT COUNT(*) FROM categories;

-- Count exercises
SELECT COUNT(*) FROM exercises;

-- Verify all exercises have categories
SELECT COUNT(*)
FROM exercises e
LEFT JOIN categories c ON e.category_id = c.id
WHERE c.id IS NULL;
-- Should return 0

-- Verify difficulty values
SELECT difficulty, COUNT(*)
FROM exercises
GROUP BY difficulty;
-- Should only show: easy, medium, hard
```

### ✅ Environment Variables

**Production `.env` file:**

- [ ] `SUPABASE_URL` set to production Supabase URL
- [ ] `SUPABASE_KEY` set to production anon key (not service role key)
- [ ] `OPENROUTER_API_KEY` set (if using AI features)
- [ ] No development/test credentials in production

**Verification:**

```bash
# Check environment variables are set
grep -E "SUPABASE_URL|SUPABASE_KEY" .env

# Ensure no test/dev values
grep -i "localhost" .env  # Should return nothing
grep -i "example" .env    # Should return nothing
```

### ✅ Authentication & Middleware

- [ ] Supabase Auth configured in production
- [ ] Middleware validates JWT tokens (`src/middleware/index.ts`)
- [ ] `context.locals.user` properly populated
- [ ] `context.locals.supabase` provides authenticated client
- [ ] Session cookies properly set with secure flags

**Test authentication flow:**

1. Register new user in production
2. Login with credentials
3. Verify session cookies are set
4. Access protected API endpoint
5. Logout and verify session cleared

### ✅ API Endpoints Testing

**Test in production environment:**

#### GET /api/exercises

- [ ] Without auth returns 401
- [ ] With auth returns 200 and data
- [ ] Pagination works (page, limit)
- [ ] Filtering by category_id works
- [ ] Filtering by difficulty works (single value)
- [ ] Filtering by difficulty works (multiple values)
- [ ] Search by name works (case-insensitive)
- [ ] Invalid UUID returns 400
- [ ] Invalid difficulty returns 400
- [ ] Limit > 100 returns 400
- [ ] Empty results return empty array (not error)

#### GET /api/exercises/:id

- [ ] Without auth returns 401
- [ ] With auth and valid ID returns 200
- [ ] Invalid UUID format returns 400
- [ ] Non-existent exercise returns 404
- [ ] Response includes full category details

**Performance benchmarks:**

- [ ] List query: < 200ms
- [ ] Search query: < 500ms
- [ ] Detail query: < 200ms

### ✅ Security

- [ ] RLS policies prevent cross-user data access
- [ ] API endpoints validate authentication
- [ ] Input validation with Zod schemas
- [ ] No SQL injection vulnerabilities
- [ ] CORS configured properly
- [ ] Rate limiting configured (if applicable)
- [ ] HTTPS enabled in production
- [ ] Security headers configured

**Security scan:**

```bash
# Run npm audit
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high
```

### ✅ Monitoring & Logging

- [ ] Error logging configured
- [ ] 500 errors logged with stack traces
- [ ] Performance monitoring enabled
- [ ] Database query performance tracked
- [ ] Alert system for critical errors

**Supabase Dashboard:**

- [ ] Database health checks enabled
- [ ] API usage monitoring active
- [ ] Error rate tracking enabled

### ✅ Documentation

- [x] API endpoints documented in README
- [x] Testing guide created (`.ai/exercises-testing-guide.md`)
- [x] Implementation plan documented (`.ai/exercises-implementation-plan.md`)
- [ ] Deployment steps documented
- [ ] Rollback plan documented

---

## Deployment Steps

### Step 1: Pre-deployment

1. **Code freeze** - No new changes until deployment complete
2. **Create backup** - Backup production database
3. **Tag release** - Create git tag for this version

```bash
# Create git tag
git tag -a v1.0.0-exercises-api -m "Exercises API implementation"
git push origin v1.0.0-exercises-api
```

### Step 2: Database Migration

1. **Verify current state** - Check existing tables and data
2. **Create migration** - SQL script for any schema changes
3. **Test migration** - Run in staging environment first
4. **Apply migration** - Execute in production

```sql
-- Example migration verification
BEGIN;

-- Verify tables exist
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM exercises;

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('categories', 'exercises');

-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('categories', 'exercises');

COMMIT;
```

### Step 3: Deploy Application Code

**Using Docker (DigitalOcean):**

```bash
# Build production image
npm run build

# Create Docker image
docker build -t gym-track:latest .

# Push to registry
docker push your-registry/gym-track:latest

# Deploy to DigitalOcean
# (Follow your CI/CD pipeline)
```

**Using GitHub Actions:**

1. Push to `main` branch
2. CI/CD pipeline runs automatically
3. Tests pass
4. Build succeeds
5. Deploy to production

### Step 4: Smoke Tests

**Immediately after deployment:**

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test exercises list (with auth)
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/exercises

# Test exercise detail (with auth)
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/exercises/$EXERCISE_ID
```

### Step 5: Monitoring

- [ ] Check application logs for errors
- [ ] Monitor API response times
- [ ] Verify database connections
- [ ] Check error rates in monitoring dashboard

**First 24 hours:**

- Monitor every 1 hour for first 6 hours
- Monitor every 4 hours for next 18 hours
- Check error logs daily for first week

### Step 6: User Acceptance

- [ ] Notify stakeholders deployment is complete
- [ ] Provide testing instructions
- [ ] Gather feedback
- [ ] Document any issues

---

## Rollback Plan

**If critical issues found:**

### Step 1: Immediate Actions

1. **Alert team** - Notify all stakeholders
2. **Document issue** - Record error messages and steps to reproduce
3. **Decide on rollback** - Assess severity and impact

### Step 2: Rollback Database (if needed)

```sql
-- Restore from backup
-- (Use Supabase dashboard or CLI)
```

### Step 3: Rollback Application Code

**Using git:**

```bash
# Revert to previous version
git revert HEAD

# Or reset to previous tag
git reset --hard v0.9.0

# Force push (use with caution)
git push --force origin main
```

**Using Docker:**

```bash
# Deploy previous image version
docker pull your-registry/gym-track:previous-version
docker run -d your-registry/gym-track:previous-version
```

### Step 4: Verify Rollback

- [ ] Application loads successfully
- [ ] API endpoints respond correctly
- [ ] Database connections work
- [ ] No new errors in logs

### Step 5: Post-Rollback

1. **Root cause analysis** - Identify what went wrong
2. **Fix issues** - Implement proper fixes
3. **Test thoroughly** - Ensure fixes work
4. **Plan re-deployment** - Schedule next deployment attempt

---

## Post-Deployment

### Week 1

- [ ] Monitor daily for errors
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Document any issues found

### Week 2

- [ ] Analyze usage patterns
- [ ] Identify optimization opportunities
- [ ] Plan next iteration
- [ ] Update documentation based on learnings

### Ongoing

- [ ] Regular security audits
- [ ] Performance monitoring
- [ ] Database optimization (analyze slow queries)
- [ ] Keep dependencies updated

---

## Success Criteria

Deployment is considered successful when:

- ✅ All API endpoints respond correctly
- ✅ Authentication works for all users
- ✅ Database queries perform within targets
- ✅ No critical errors in logs
- ✅ User feedback is positive
- ✅ Response times meet SLA
- ✅ All smoke tests pass
- ✅ Zero downtime achieved

---

## Contacts

**In case of issues:**

- **Backend Team Lead**: [Name/Email]
- **DevOps**: [Name/Email]
- **Database Admin**: [Name/Email]
- **On-Call Support**: [Phone/Slack]

**Emergency Procedures:**

1. Alert team via [Slack channel]
2. Check monitoring dashboard: [URL]
3. Access logs: [URL/command]
4. Escalation path: [Defined roles]
