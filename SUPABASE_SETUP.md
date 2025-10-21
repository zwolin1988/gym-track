# Supabase Configuration for Gym Track MVP

This document contains required Supabase configuration steps for the authentication module according to `auth-spec.md`.

## Required Configuration Steps

### 1. Email Authentication Provider

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Ensure **Email** provider is **enabled**
3. Click on the **Email** provider to configure settings

### 2. Disable Email Confirmation (MVP Requirement)

**IMPORTANT for MVP**: Email confirmation must be disabled for MVP according to PRD section 4.2.

#### Steps:

1. Go to **Authentication** → **Providers** → **Email**
2. Find the setting **"Confirm email"**
3. Set it to **OFF** (disabled)
4. Click **Save**

**Why disabled in MVP:**
- Simplifies user onboarding flow
- Users can log in immediately after registration
- Email confirmation is planned for future versions (post-MVP)

### 3. URL Configuration

Configure allowed URLs for authentication redirects:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: Your production domain (e.g., `https://gymtrack.app`)
3. Add **Redirect URLs** (if needed for social auth in future):
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

### 4. Email Templates (Optional - Post-MVP)

Email templates customization is **not required for MVP** but can be configured later:

1. Go to **Authentication** → **Email Templates**
2. Available templates:
   - Confirmation email (not used in MVP)
   - Magic Link (not used in MVP)
   - Password Reset (not used in MVP)
   - Email Change (not used in MVP)

## Verification Checklist

After configuration, verify the following:

- [ ] Email provider is enabled
- [ ] Email confirmation is **DISABLED** (Confirm email = OFF)
- [ ] Site URL is set correctly for your environment
- [ ] You can register a new user without email confirmation
- [ ] You can log in immediately after registration

## Testing Configuration

To verify your configuration is correct:

1. Start your development server: `npm run dev`
2. Navigate to `/auth/register`
3. Register a new user with a test email
4. You should:
   - ✅ Receive success message immediately
   - ✅ Be redirected to `/dashboard`
   - ✅ **NOT** receive a confirmation email
   - ✅ Be able to log out and log in again immediately

If you receive an error about "Email not confirmed", email confirmation is still enabled - go back to step 2.

## Environment Variables

Ensure your `.env` file contains:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key
```

These are available in Supabase Dashboard → **Project Settings** → **API**.

## Row Level Security (RLS)

RLS policies will be configured separately for database tables. This document only covers Auth configuration.

For RLS setup, see the migration files in `supabase/migrations/` or refer to `auth-spec.md` section 6.

## Troubleshooting

### Issue: "Email not confirmed" error on login

**Solution**: Email confirmation is still enabled. Go to Authentication → Providers → Email and disable "Confirm email".

### Issue: Can't register users

**Solution**:
1. Check that Email provider is enabled
2. Verify environment variables are correct
3. Check browser console for errors
4. Verify Supabase project is not paused (free tier)

### Issue: Session not persisting

**Solution**:
1. Check that cookies are enabled in browser
2. Verify middleware is correctly configured (`src/middleware/index.ts`)
3. Check that `@supabase/ssr` is properly installed

## Support

For Supabase-specific issues, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Discord Community](https://discord.supabase.com)

For project-specific issues, refer to `auth-spec.md` or contact the development team.
