-- =====================================================
-- Migration: Seed Categories and Exercises
-- Created: 2025-10-20 12:01:00 UTC
-- Author: Database Migration Script
-- =====================================================
--
-- Purpose:
--   Seeds the database with initial data for MVP:
--   - 7 muscle group categories
--   - 70 exercises (10 per category)
--   - Polish exercise names with English slugs for SEO
--
-- Tables affected:
--   - categories (insert 7 records)
--   - exercises (insert 70 records)
--
-- Special notes:
--   - All image_path values are placeholders (NULL for MVP)
--   - Slugs are URL-friendly English identifiers
--   - Difficulty levels are distributed: easy, medium, hard
--   - Categories are ordered by typical workout priority
--   - Exercise IDs are UUIDs (auto-generated)
-- =====================================================

-- =====================================================
-- SECTION 1: SEED CATEGORIES
-- =====================================================

-- Insert 7 main muscle group categories
-- Order reflects typical workout split priority
insert into categories (name, slug, description, image_path, image_alt, order_index) values
  (
    'Klatka Piersiowa',
    'chest',
    'Ćwiczenia na mięśnie klatki piersiowej (pectoralis major i minor)',
    null, -- Placeholder: add image path when assets are ready
    'Ilustracja mięśni klatki piersiowej',
    1
  ),
  (
    'Plecy',
    'back',
    'Ćwiczenia na mięśnie grzbietu (latissimus dorsi, trapezius, rhomboids)',
    null,
    'Ilustracja mięśni pleców',
    2
  ),
  (
    'Nogi',
    'legs',
    'Ćwiczenia na mięśnie nóg (quadriceps, hamstrings, glutes, calves)',
    null,
    'Ilustracja mięśni nóg',
    3
  ),
  (
    'Barki',
    'shoulders',
    'Ćwiczenia na mięśnie ramion (deltoid anterior, lateral, posterior)',
    null,
    'Ilustracja mięśni barków',
    4
  ),
  (
    'Biceps',
    'biceps',
    'Ćwiczenia na mięsień dwugłowy ramienia (biceps brachii)',
    null,
    'Ilustracja mięśnia bicepsa',
    5
  ),
  (
    'Triceps',
    'triceps',
    'Ćwiczenia na mięsień trójgłowy ramienia (triceps brachii)',
    null,
    'Ilustracja mięśnia tricepsa',
    6
  ),
  (
    'Brzuch',
    'abs-core',
    'Ćwiczenia na mięśnie brzucha i core (rectus abdominis, obliques, transversus)',
    null,
    'Ilustracja mięśni brzucha',
    7
  );

-- =====================================================
-- SECTION 2: SEED EXERCISES
-- =====================================================

-- Note: We use subqueries to get category_id by slug for readability
-- This makes the migration more maintainable than hardcoding UUIDs

-- -----------------------------------------------------
-- Category 1: Klatka Piersiowa (Chest) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Wyciskanie sztangi na ławce płaskiej',
    'Klasyczne wyciskanie sztangi leżąc na płaskiej ławce. Podstawowe ćwiczenie na klatkę piersiową.',
    null,
    'Demonstracja wyciskania sztangi na ławce płaskiej',
    'medium',
    (select id from categories where slug = 'chest')
  ),
  (
    'Wyciskanie hantli skos dodatni',
    'Wyciskanie hantli na ławce ustawionej pod kątem 30-45°. Angażuje górną część klatki piersiowej.',
    null,
    'Demonstracja wyciskania hantli na skosie dodatnim',
    'medium',
    (select id from categories where slug = 'chest')
  ),
  (
    'Pompki (Push-ups)',
    'Klasyczne pompki z ciężarem własnego ciała. Podstawowe ćwiczenie angażujące klatkę, triceps i barki.',
    null,
    'Demonstracja wykonania pompek',
    'easy',
    (select id from categories where slug = 'chest')
  ),
  (
    'Rozpiętki hantlami na ławce płaskiej',
    'Izolowane ćwiczenie na klatkę piersiową. Rozciąga mięśnie i skupia się na środkowej części klatki.',
    null,
    'Demonstracja rozpiętki hantlami na ławce płaskiej',
    'easy',
    (select id from categories where slug = 'chest')
  ),
  (
    'Wyciskanie na maszynie Smitha skos ujemny',
    'Wyciskanie na maszynie Smitha z ławką ustawioną pod kątem ujemnym. Celuje w dolną część klatki.',
    null,
    'Demonstracja wyciskania na maszynie Smitha',
    'medium',
    (select id from categories where slug = 'chest')
  ),
  (
    'Krzyżowanie linek wyciągu górnego (Cable Crossover)',
    'Ćwiczenie na wyciągu z krzyżowaniem lin. Angażuje środkową i dolną część klatki piersiowej.',
    null,
    'Demonstracja cable crossover',
    'medium',
    (select id from categories where slug = 'chest')
  ),
  (
    'Wyciskanie hantli na ławce neutralnej',
    'Wyciskanie hantli z chwytem neutralnym (młotkowym). Mniejsze obciążenie dla stawów barkowych.',
    null,
    'Demonstracja wyciskania hantli chwytem neutralnym',
    'medium',
    (select id from categories where slug = 'chest')
  ),
  (
    'Rozpiętki na maszynie (Pec Deck)',
    'Izolowane ćwiczenie na maszynie pec deck. Bezpieczne dla początkujących, angażuje środek klatki.',
    null,
    'Demonstracja rozpiętki na pec deck',
    'easy',
    (select id from categories where slug = 'chest')
  ),
  (
    'Pompki na poręczach (Dips) z pochyleniem',
    'Pompki na poręczach z nachyleniem tułowia do przodu. Intensywne ćwiczenie na dolną część klatki.',
    null,
    'Demonstracja pompek na poręczach dla klatki',
    'hard',
    (select id from categories where slug = 'chest')
  ),
  (
    'Wyciskanie hantli skos ujemny',
    'Wyciskanie hantli na ławce z kątem ujemnym. Skupia się na dolnej części mięśni piersiowych.',
    null,
    'Demonstracja wyciskania hantli na skosie ujemnym',
    'medium',
    (select id from categories where slug = 'chest')
  );

-- -----------------------------------------------------
-- Category 2: Plecy (Back) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Martwy ciąg klasyczny',
    'Podstawowe ćwiczenie wielostawowe. Angażuje plecy, nogi, core. Wymaga prawidłowej techniki.',
    null,
    'Demonstracja martwego ciągu klasycznego',
    'hard',
    (select id from categories where slug = 'back')
  ),
  (
    'Podciąganie szerokim chwytem',
    'Podciąganie na drążku z szerokim nachwtem. Rozwija szerokość grzbietu (latissimus dorsi).',
    null,
    'Demonstracja podciągania szerokim chwytem',
    'hard',
    (select id from categories where slug = 'back')
  ),
  (
    'Wiosłowanie sztangą w opadzie tułowia',
    'Wiosłowanie ze sztangą w pochyleniu. Buduje grubość pleców i angażuje środkową część grzbietu.',
    null,
    'Demonstracja wiosłowania sztangą',
    'medium',
    (select id from categories where slug = 'back')
  ),
  (
    'Ściąganie drążka wyciągu górnego (nachwyt)',
    'Ściąganie drążka na wyciągu górnym. Alternatywa dla podciągań, łatwiejsza kontrola obciążenia.',
    null,
    'Demonstracja ściągania drążka wyciągu',
    'medium',
    (select id from categories where slug = 'back')
  ),
  (
    'Wiosłowanie hantlą jednorącz',
    'Wiosłowanie hantlą z podporem na ławce. Izoluje jedną stronę grzbietu, koryguje dysbalanse.',
    null,
    'Demonstracja wiosłowania hantlą jednorącz',
    'medium',
    (select id from categories where slug = 'back')
  ),
  (
    'Wiosłowanie na maszynie siedząc (Cable Row)',
    'Wiosłowanie na wyciągu dolnym siedząc. Bezpieczne dla początkujących, angażuje środek pleców.',
    null,
    'Demonstracja wiosłowania na wyciągu',
    'easy',
    (select id from categories where slug = 'back')
  ),
  (
    'Unoszenie tułowia (Hiperextensje)',
    'Ćwiczenie na dolną część pleców (erector spinae). Wzmacnia mięśnie prostownika grzbietu.',
    null,
    'Demonstracja hiperextensji',
    'easy',
    (select id from categories where slug = 'back')
  ),
  (
    'Podciąganie chwytem neutralnym',
    'Podciąganie z chwytem neutralnym (młotkowym). Mniej obciąża barki, angażuje środkową część pleców.',
    null,
    'Demonstracja podciągania chwytem neutralnym',
    'hard',
    (select id from categories where slug = 'back')
  ),
  (
    'Pullover ze sztangą/hantlem',
    'Pullover na ławce płaskiej. Rozciąga latissimus dorsi i angażuje klatkę piersiową.',
    null,
    'Demonstracja pullover z hantlem',
    'easy',
    (select id from categories where slug = 'back')
  ),
  (
    'Good morning (Dzień dobry)',
    'Ćwiczenie z nachyleniem tułowia ze sztangą na plecach. Wzmacnia dolną część pleców i biceps uda.',
    null,
    'Demonstracja ćwiczenia good morning',
    'medium',
    (select id from categories where slug = 'back')
  );

-- -----------------------------------------------------
-- Category 3: Nogi (Legs) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Przysiady ze sztangą na plecach (High/Low Bar)',
    'Podstawowe ćwiczenie na nogi. Angażuje quadriceps, glutes, hamstrings, core. Król ćwiczeń.',
    null,
    'Demonstracja przysiadów ze sztangą',
    'hard',
    (select id from categories where slug = 'legs')
  ),
  (
    'Wypychanie ciężaru na suwnicy (Leg Press)',
    'Wypychanie na maszynie leg press. Bezpieczniejsza alternatywa dla przysiadów, izoluje nogi.',
    null,
    'Demonstracja leg press',
    'medium',
    (select id from categories where slug = 'legs')
  ),
  (
    'Wykroki z hantlami',
    'Wykroki do przodu lub w tył z hantlami. Angażuje quadriceps, glutes, hamstrings, równowagę.',
    null,
    'Demonstracja wykroków z hantlami',
    'medium',
    (select id from categories where slug = 'legs')
  ),
  (
    'Wyprosty nóg na maszynie (Leg Extension)',
    'Izolowane ćwiczenie na quadriceps. Wykonywane na maszynie leg extension.',
    null,
    'Demonstracja wyprostów nóg',
    'easy',
    (select id from categories where slug = 'legs')
  ),
  (
    'Uginanie nóg leżąc (Leg Curl)',
    'Izolowane ćwiczenie na biceps uda (hamstrings). Wykonywane na maszynie leg curl.',
    null,
    'Demonstracja uginania nóg leżąc',
    'easy',
    (select id from categories where slug = 'legs')
  ),
  (
    'Martwy ciąg na prostych nogach (Stiff-Leg Deadlift)',
    'Martwy ciąg z minimalnymi zgięciem kolan. Celuje w hamstrings i dolną część pleców.',
    null,
    'Demonstracja martwego ciągu na prostych nogach',
    'medium',
    (select id from categories where slug = 'legs')
  ),
  (
    'Przysiady bułgarskie (Bulgarian Split Squat)',
    'Przysiady na jednej nodze z tylną nogą na podwyższeniu. Zaawansowane, angażuje glutes i quadriceps.',
    null,
    'Demonstracja przysiadów bułgarskich',
    'hard',
    (select id from categories where slug = 'legs')
  ),
  (
    'Wspięcia na palce stojąc (Calf Raise)',
    'Wspięcia na palce w pozycji stojącej. Izoluje mięśnie łydek (gastrocnemius, soleus).',
    null,
    'Demonstracja wspięć na palce',
    'easy',
    (select id from categories where slug = 'legs')
  ),
  (
    'Hack Przysiady na maszynie',
    'Przysiady na maszynie hack squat. Stabilizuje ruch, angażuje quadriceps z mniejszym obciążeniem pleców.',
    null,
    'Demonstracja hack squat',
    'medium',
    (select id from categories where slug = 'legs')
  ),
  (
    'Przysiady sumo ze sztangą',
    'Przysiady z szeroko rozstawionymi nogami. Większy nacisk na przywoduciele i glutes.',
    null,
    'Demonstracja przysiadów sumo',
    'medium',
    (select id from categories where slug = 'legs')
  );

-- -----------------------------------------------------
-- Category 4: Barki (Shoulders) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Wyciskanie żołnierskie (Military Press)',
    'Wyciskanie sztangi nad głowę stojąc. Podstawowe ćwiczenie na przednią i boczną część deltoidów.',
    null,
    'Demonstracja wyciskania żołnierskiego',
    'medium',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Wyciskanie hantli siedząc nad głowę',
    'Wyciskanie hantli nad głowę w pozycji siedzącej. Większy zakres ruchu niż ze sztangą.',
    null,
    'Demonstracja wyciskania hantli siedząc',
    'medium',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Unoszenie hantli bokiem (Side Lateral Raise)',
    'Izolowane unoszenie hantli w bok. Celuje w boczną część deltoidów (lateral deltoid).',
    null,
    'Demonstracja unoszenia hantli bokiem',
    'easy',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Unoszenie hantli w opadzie (Rear Delt Fly)',
    'Unoszenie hantli w pochyleniu. Izoluje tylną część deltoidów (posterior deltoid).',
    null,
    'Demonstracja unoszenia hantli w opadzie',
    'easy',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Podciąganie sztangi wzdłuż tułowia',
    'Podciąganie sztangi do brody (upright row). Angażuje boczną część deltoidów i trapez.',
    null,
    'Demonstracja podciągania sztangi wzdłuż tułowia',
    'medium',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Arnoldki (Arnold Press)',
    'Wyciskanie hantli z rotacją (Arnold Schwarzenegger press). Angażuje wszystkie części deltoidów.',
    null,
    'Demonstracja arnoldek',
    'medium',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Unoszenie hantli w przód (Front Raise)',
    'Unoszenie hantli przed siebie. Izoluje przednią część deltoidów (anterior deltoid).',
    null,
    'Demonstracja unoszenia hantli w przód',
    'easy',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Face Pulls (Przyciąganie linek do twarzy)',
    'Przyciąganie linek do twarzy na wyciągu. Wzmacnia tylną część deltoidów i mięśnie rotatorów.',
    null,
    'Demonstracja face pulls',
    'easy',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Wyciskanie sztangi zza karku',
    'Wyciskanie sztangi zza karku nad głowę. Zaawansowane, wymaga dobrej mobilności barków.',
    null,
    'Demonstracja wyciskania zza karku',
    'hard',
    (select id from categories where slug = 'shoulders')
  ),
  (
    'Rotacje zewnętrzne z taśmą/linką',
    'Rotacje zewnętrzne ramion z oporem. Wzmacnia mięśnie rotatorów (rotator cuff) - prewencja urazów.',
    null,
    'Demonstracja rotacji zewnętrznych',
    'easy',
    (select id from categories where slug = 'shoulders')
  );

-- -----------------------------------------------------
-- Category 5: Biceps (Biceps) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Uginanie ramion ze sztangą stojąc',
    'Klasyczne uginanie bicepsów ze sztangą prostą. Podstawowe ćwiczenie na biceps brachii.',
    null,
    'Demonstracja uginania ze sztangą',
    'medium',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie hantlami z supinacją (Supinated Dumbbell Curl)',
    'Uginanie hantli z rotacją nadgarstka (supinacja). Maksymalnie angażuje biceps i brachialis.',
    null,
    'Demonstracja uginania z supinacją',
    'easy',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie młotkowe (Hammer Curl)',
    'Uginanie hantli z chwytem neutralnym. Angażuje brachialis i brachioradialis (przedramię).',
    null,
    'Demonstracja młotków',
    'easy',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie ramion na modlitewniku (Preacher Curl)',
    'Uginanie na ławce larry scott (modlitewnik). Izoluje biceps, eliminuje momentum.',
    null,
    'Demonstracja uginania na modlitewniku',
    'medium',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie na wyciągu dolnym z liną',
    'Uginanie bicepsów na wyciągu dolnym z użyciem liny. Stałe napięcie przez cały zakres ruchu.',
    null,
    'Demonstracja uginania na wyciągu z liną',
    'easy',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie ramion (koncentryczne) siedząc',
    'Uginanie koncentryczne - jednorącz z podporem na udzie. Maksymalna izolacja bicepsa.',
    null,
    'Demonstracja uginania koncentrycznego',
    'medium',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie z uchwytem prostym (EZ Bar Curl)',
    'Uginanie ze sztangą łamaną (EZ bar). Bardziej ergonomiczne dla nadgarstków niż sztanga prosta.',
    null,
    'Demonstracja uginania z EZ bar',
    'medium',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie nadgarstków podchwytem (Wrist Curl)',
    'Uginanie nadgarstków podchwytem. Wzmacnia mięśnie przedramion (flexor carpi).',
    null,
    'Demonstracja uginania nadgarstków',
    'easy',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie hantlami na ławce skośnej',
    'Uginanie hantli na ławce z kątem dodatnim. Rozciąga biceps, większy zakres ruchu.',
    null,
    'Demonstracja uginania na skosie',
    'medium',
    (select id from categories where slug = 'biceps')
  ),
  (
    'Uginanie ramion chwytem odwrotnym (Reverse Curl)',
    'Uginanie ze sztangą chwytem nachwytowym. Angażuje brachioradialis i przedramiona.',
    null,
    'Demonstracja uginania odwrotnego',
    'medium',
    (select id from categories where slug = 'biceps')
  );

-- -----------------------------------------------------
-- Category 6: Triceps (Triceps) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Prostowanie ramion na wyciągu górnym (pushdown)',
    'Prostowanie tricepsów na wyciągu górnym. Podstawowe ćwiczenie izolujące triceps.',
    null,
    'Demonstracja pushdown',
    'easy',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Wyciskanie francuskie leżąc ze sztangą (Skull Crushers)',
    'Wyciskanie francuskie leżąc (skull crushers). Intensywne ćwiczenie na wszystkie głowy tricepsa.',
    null,
    'Demonstracja skull crushers',
    'medium',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Wyciskanie na ławce wąskim chwytem',
    'Wyciskanie sztangi wąskim chwytem na ławce płaskiej. Angażuje triceps i środek klatki.',
    null,
    'Demonstracja wyciskania wąskim chwytem',
    'medium',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Pompki na poręczach (Dips) pionowe',
    'Pompki na poręczach z pionową pozycją. Intensywne ćwiczenie na triceps i klatkę.',
    null,
    'Demonstracja pompek na poręczach',
    'hard',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Prostowanie ramion zza głowy hantlem (Overhead Extension)',
    'Prostowanie ramienia zza głowy z hantlem. Rozciąga długą głowę tricepsa.',
    null,
    'Demonstracja overhead extension',
    'medium',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Kickbacks hantlami',
    'Wyprosty ramion w tył z hantlami (kickbacks). Izoluje triceps, wymaga lekkiego ciężaru.',
    null,
    'Demonstracja kickbacks',
    'easy',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Prostowanie ramion z liną (Rope Pushdown)',
    'Prostowanie tricepsów z liną na wyciągu. Pozwala na większy zakres ruchu niż zwykły pushdown.',
    null,
    'Demonstracja rope pushdown',
    'easy',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Wyciskanie francuskie siedząc na maszynie',
    'Wyciskanie francuskie na maszynie w pozycji siedzącej. Stabilizuje ruch, łatwa kontrola.',
    null,
    'Demonstracja wyciskania francuskiego na maszynie',
    'medium',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Pompki szwedzkie (Bench Dips)',
    'Pompki z nogami na podłodze, ręce na ławce. Ćwiczenie z ciężarem własnym dla tricepsów.',
    null,
    'Demonstracja pompek szwedzkich',
    'easy',
    (select id from categories where slug = 'triceps')
  ),
  (
    'Wyciskanie sztangi do czoła na skosie ujemnym',
    'Skull crushers na ławce z kątem ujemnym. Większy rozciąg tricepsów, zaawansowane.',
    null,
    'Demonstracja skull crushers na skosie',
    'medium',
    (select id from categories where slug = 'triceps')
  );

-- -----------------------------------------------------
-- Category 7: Brzuch (Abs/Core) - 10 exercises
-- -----------------------------------------------------
insert into exercises (name, description, image_path, image_alt, difficulty, category_id) values
  (
    'Plank (Deska)',
    'Statyczne ćwiczenie w podporze na przedramionach. Wzmacnia wszystkie mięśnie core.',
    null,
    'Demonstracja planki',
    'easy',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Spięcia brzucha (Crunches)',
    'Klasyczne spięcia brzucha (crunches). Podstawowe ćwiczenie na mięsień prosty brzucha.',
    null,
    'Demonstracja crunches',
    'easy',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Unoszenie nóg w zwisie (Hanging Leg Raise)',
    'Unoszenie nóg w zwisie na drążku. Zaawansowane, angażuje dolną część brzucha i hip flexors.',
    null,
    'Demonstracja unoszenia nóg w zwisie',
    'hard',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Rowerek (Bicycle Crunches)',
    'Skręty tułowia z unoszeniem nóg (rowerek). Angażuje mięśnie skośne brzucha.',
    null,
    'Demonstracja roweru',
    'easy',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Allahy (Ab Rollout)',
    'Rollout z kółkiem ab roller. Zaawansowane, angażuje całe core i stabilizatory.',
    null,
    'Demonstracja ab rollout',
    'medium',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Wznosy nóg leżąc',
    'Unoszenie prostych nóg leżąc na plecach. Celuje w dolną część brzucha.',
    null,
    'Demonstracja wznoszenia nóg',
    'easy',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Skłony boczne z hantlem',
    'Skłony boczne tułowia z hantlem. Wzmacnia mięśnie skośne brzucha (obliques).',
    null,
    'Demonstracja skłonów bocznych',
    'medium',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Rosyjski twist (Russian Twist)',
    'Skręty tułowia siedząc z uniesionymi nogami. Angażuje mięśnie skośne i core.',
    null,
    'Demonstracja rosyjskiego twista',
    'medium',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Mountain Climbers',
    'Dynamiczne przyciąganie kolan do klatki w podporze. Cardio + core, angażuje całe ciało.',
    null,
    'Demonstracja mountain climbers',
    'easy',
    (select id from categories where slug = 'abs-core')
  ),
  (
    'Martwy robak (Dead Bug)',
    'Ćwiczenie leżąc na plecach z naprzemiennym prostowaniem nóg i rąk. Stabilizacja core.',
    null,
    'Demonstracja martwego robaka',
    'easy',
    (select id from categories where slug = 'abs-core')
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment below to verify data after migration

-- Check categories count (should be 7)
-- select count(*) as total_categories from categories;

-- Check exercises count (should be 70)
-- select count(*) as total_exercises from exercises;

-- Check exercises per category (should be 10 each)
-- select
--   c.name as category,
--   count(e.id) as exercise_count
-- from categories c
-- left join exercises e on e.category_id = c.id
-- group by c.id, c.name
-- order by c.order_index;

-- Check difficulty distribution
-- select
--   difficulty,
--   count(*) as count
-- from exercises
-- group by difficulty
-- order by difficulty;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Migration completed successfully
-- Summary:
--   - 7 categories inserted
--   - 70 exercises inserted (10 per category)
--   - All exercises linked to appropriate categories
--   - Difficulty levels: easy, medium, hard distributed
--   - All slugs are URL-friendly for SEO
--   - Image paths are NULL (placeholders for MVP)
-- Next steps:
--   1. Add exercise images to Supabase Storage
--   2. Update image_path columns with actual paths
--   3. Verify data via Supabase dashboard or SQL queries
