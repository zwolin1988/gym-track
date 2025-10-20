# Dokument Wymagań Produktu (PRD) - Gym Track

## 1. Przegląd produktu

### 1.1. Nazwa produktu
Gym Track

### 1.2. Wersja
MVP 1.0

### 1.3. Cel produktu
Gym Track to aplikacja webowa umożliwiająca użytkownikom śledzenie postępów treningowych poprzez wykonywanie treningów opartych na wcześniej zdefiniowanych planach treningowych. Aplikacja pozwala na tworzenie spersonalizowanych planów, rejestrowanie wykonanych ćwiczeń z szczegółowymi parametrami (serie, powtórzenia, ciężar) oraz analizę wyników treningowych w czasie.

### 1.4. Grupa docelowa
- Osoby regularnie trenujące na siłowni
- Entuzjaści fitnessu pragnący systematycznie śledzić swoje postępy
- Użytkownicy poszukujący prostego narzędzia do planowania i logowania treningów
- Początkujący i średniozaawansowani użytkownicy siłowni

### 1.5. Platforma
Aplikacja webowa (dostępna przez przeglądarkę) z możliwością instalacji jako PWA (Progressive Web App)

### 1.6. Stack technologiczny
- Frontend: Astro + React, Tailwind CSS, Chart.js/Recharts
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Hosting: Do określenia (z możliwością publicznego URL)
- CI/CD: Pipeline automatyzujący testy i wdrożenia

### 1.7. Zgodność z wymaganiami kursowymi
Projekt realizuje wszystkie obowiązkowe wymagania kursowe:
- Logowanie i autoryzacja (Supabase Auth)
- Operacje CRUD (plany treningowe, treningi)
- Logika biznesowa (obliczanie statystyk, walidacja danych)
- Dokumentacja (PRD, specyfikacje techniczne)
- Testy (minimum 1 test użytkownika z Playwright)
- Pipeline CI/CD

Opcjonalne:
- Publiczny URL aplikacji
- Możliwość instalacji jako PWA

## 2. Problem użytkownika

### 2.1. Opis problemu
Osoby regularnie trenujące na siłowni często borykają się z następującymi wyzwaniami:

1. Brak systematycznego śledzenia postępów: Trudność w zapamiętaniu parametrów treningowych z poprzednich sesji (ciężar, powtórzenia), co utrudnia progresywne przeciążenie.

2. Chaos w planowaniu: Brak zorganizowanego podejścia do treningów prowadzi do chaotycznych sesji treningowych bez jasnej struktury.

3. Brak widoczności postępów: Niemożność szybkiego sprawdzenia, czy następuje progres w poszczególnych ćwiczeniach lub ogólnej objętości treningowej.

4. Nieefektywne narzędzia: Istniejące rozwiązania są zbyt skomplikowane, wymagają zbędnych funkcji lub nie oferują prostoty potrzebnej podczas intensywnego treningu.

5. Trudność w modyfikacji treningów: Potrzeba elastyczności podczas sesji treningowej (zmiana ciężaru, dodanie serii) bez utraty struktury planu.

### 2.2. Dlaczego to jest problem wartościowy do rozwiązania
- Systematyczne śledzenie treningów jest kluczowym elementem osiągania celów fitnessowych
- Brak odpowiedniego narzędzia prowadzi do stagnacji w postępach
- Progresywne przeciążenie wymaga dokładnej znajomości poprzednich wyników
- Motywacja rośnie, gdy użytkownik widzi swoje postępy w formie wizualnej (wykresy, statystyki)

### 2.3. Jak produkt rozwiązuje problem
Gym Track oferuje:
- Prosty i intuicyjny interfejs do tworzenia planów treningowych z predefiniowanymi ćwiczeniami
- Szybkie logowanie treningów z możliwością modyfikacji parametrów w czasie rzeczywistym
- Automatyczne obliczanie kluczowych statystyk (objętość treningowa, czas trwania, maksymalny ciężar)
- Historię treningów z wizualizacją postępów w czasie (wykresy objętości treningowej)
- Elastyczność podczas treningu (dodawanie serii, modyfikacja parametrów) przy zachowaniu struktury planu
- Dostęp z dowolnego urządzenia poprzez przeglądarkę lub PWA

## 3. Wymagania funkcjonalne

### 3.1. Autoryzacja i uwierzytelnianie

3.1.1. System logowania i rejestracji użytkowników za pomocą Supabase Auth
3.1.2. Bezpieczne przechowywanie danych użytkownika z zastosowaniem Row Level Security (RLS)
3.1.3. Ochrona tras wymagających autoryzacji (przekierowanie do logowania)
3.1.4. Sesje użytkownika z możliwością wylogowania

### 3.2. Baza ćwiczeń

3.2.1. Predefiniowana baza ćwiczeń zawierająca:
   - Nazwę ćwiczenia
   - Opis techniki wykonania
   - Obrazek ilustrujący ćwiczenie (URL z Supabase Storage)
   - Poziom trudności (Easy, Medium, Hard)
   - Kategorię (np. Klatka piersiowa, Plecy, Nogi, Ramiona, etc.)

3.2.2. Minimalna baza MVP: Top 50 najbardziej popularnych ćwiczeń siłowych

3.2.3. Baza kategorii zawierająca:
   - Nazwę kategorii
   - Opis kategorii
   - Obrazek reprezentujący kategorię

3.2.4. Minimalna baza MVP: 5-10 głównych kategorii mięśniowych

3.2.5. Interfejs przeglądania ćwiczeń z możliwością:
   - Filtrowania po kategorii
   - Filtrowania po poziomie trudności
   - Wyszukiwania po nazwie
   - Wyświetlania szczegółów ćwiczenia (obrazek, opis, parametry)

### 3.3. Zarządzanie planami treningowymi (CRUD)

3.3.1. Tworzenie planu treningowego:
   - Nadanie nazwy planu (wymagane, min. 3 znaki)
   - Opcjonalny opis planu (max 500 znaków)
   - Plan musi zawierać co najmniej jedno ćwiczenie (walidacja)

3.3.2. Dodawanie ćwiczeń do planu:
   - Wybór ćwiczeń z bazy poprzez interfejs z filtrowaniem/wyszukiwaniem
   - Możliwość dodania tego samego ćwiczenia wielokrotnie (np. w różnych wariantach)
   - Kolejność ćwiczeń w planie (możliwość zmiany kolejności)

3.3.3. Definiowanie serii dla każdego ćwiczenia w planie:
   - Relacja 1:N (jedno ćwiczenie w planie może mieć wiele serii)
   - Dla każdej serii określenie:
     - Liczby powtórzeń (wymagane, wartość > 0)
     - Ciężaru w kilogramach (opcjonalne, wartość ≥ 0)
     - Niektóre ćwiczenia mogą nie mieć ciężaru (np. pompki, podciągania)
   - Możliwość dodania wielu serii do jednego ćwiczenia
   - Możliwość usunięcia serii

3.3.4. Edycja planu treningowego:
   - Modyfikacja nazwy i opisu planu
   - Dodawanie/usuwanie ćwiczeń z planu
   - Modyfikacja serii (powtórzenia, ciężar)
   - Zmiana kolejności ćwiczeń
   - WAŻNE: Modyfikacje planu NIE wpływają na historyczne, zakończone treningi

3.3.5. Usuwanie planu treningowego:
   - Możliwość usunięcia planu
   - Ostrzeżenie przed usunięciem, jeśli istnieją powiązane treningi
   - Opcjonalnie: soft delete (oznaczenie jako usunięty zamiast fizycznego usunięcia)

3.3.6. Przeglądanie listy planów treningowych:
   - Lista wszystkich planów użytkownika
   - Wyświetlanie nazwy, opisu i liczby ćwiczeń w planie
   - Możliwość sortowania (data utworzenia, nazwa)
   - Możliwość wyszukiwania po nazwie

### 3.4. Logowanie treningu (Workout Logger)

3.4.1. Rozpoczęcie treningu:
   - Wybór planu treningowego z listy
   - Automatyczne utworzenie sesji treningowej z datą i godziną rozpoczęcia
   - Załadowanie ćwiczeń i serii z wybranego planu jako podstawy do logowania
   - Reguła biznesowa: Użytkownik może mieć aktywny tylko jeden trening jednocześnie
   - Blokada rozpoczęcia nowego treningu, jeśli istnieje aktywny trening

3.4.2. Logowanie serii podczas treningu:
   - Wyświetlenie listy ćwiczeń i serii zgodnie z planem
   - Dla każdej serii możliwość:
     - Modyfikacji ciężaru (wartość ≥ 0)
     - Modyfikacji liczby powtórzeń (wartość > 0)
     - Oznaczenia serii jako wykonanej (checkbox/przycisk)
     - Dodania opcjonalnej notatki tekstowej (max 200 znaków)
   - Możliwość dodania dodatkowych serii do istniejących ćwiczeń w trakcie treningu
   - Wyświetlanie parametrów planowanych vs. rzeczywiście wykonanych

3.4.3. Interfejs przyjazny dla urządzeń mobilnych:
   - Duże przyciski do oznaczania wykonania serii
   - Łatwe pola do modyfikacji ciężaru i powtórzeń
   - Automatyczne uzupełnianie wartości z planu lub poprzedniej serii
   - Responsywny design dostosowany do używania w trakcie treningu

3.4.4. Zakończenie treningu:
   - Przycisk zakończenia treningu
   - Potwierdzenie zakończenia (dialog)
   - Automatyczne zapisanie daty i godziny zakończenia
   - Automatyczne obliczenie statystyk treningu
   - Przekierowanie do podsumowania treningu

### 3.5. Statystyki i podsumowanie treningu

3.5.1. Podsumowanie pojedynczego treningu zawiera:
   - Data i godzina rozpoczęcia
   - Data i godzina zakończenia
   - Całkowity czas trwania treningu (w minutach)
   - Liczba wykonanych ćwiczeń (unikalne)
   - Łączna liczba wykonanych serii
   - Łączna liczba powtórzeń (suma wszystkich serii)
   - Maksymalny ciężar użyty w treningu (pojedyncza seria)
   - Całkowita objętość treningowa (Total Volume)

3.5.2. Obliczanie całkowitej objętości treningowej:
   - Formuła: Σ(Ciężar × Powtórzenia) dla każdej wykonanej serii
   - Serie bez określonego ciężaru są ignorowane w obliczeniach objętości
   - Jednostka: kilogramy (kg)
   - Tylko serie oznaczone jako wykonane są uwzględniane w obliczeniach

3.5.3. Historia treningów:
   - Widok listy wszystkich zakończonych treningów
   - Sortowanie chronologiczne (od najnowszych)
   - Dla każdego treningu wyświetlenie:
     - Data treningu
     - Nazwa użytego planu
     - Czas trwania
     - Objętość treningowa
   - Możliwość przejścia do szczegółów treningu
   - Możliwość filtrowania po planie treningowym
   - Możliwość filtrowania po zakresie dat

3.5.4. Wizualizacja postępów (wykresy):
   - Wykres całkowitej objętości treningowej w czasie (ostatnie 4 tygodnie)
   - Oś X: Data treningu
   - Oś Y: Objętość treningowa (kg)
   - Typ wykresu: Liniowy lub słupkowy
   - Minimalny MVP: Jeden kluczowy wykres objętości

### 3.6. Walidacja danych

3.6.1. Walidacja na poziomie UI:
   - Wymagane pola są oznaczone wizualnie
   - Natychmiastowa informacja zwrotna o błędach walidacji
   - Blokada przesłania formularza przy nieprawidłowych danych

3.6.2. Walidacja na poziomie bazy danych:
   - Constraint: Powtórzenia > 0
   - Constraint: Ciężar ≥ 0 (jeśli podany)
   - Constraint: Plan musi zawierać co najmniej jedno ćwiczenie
   - Constraint: Nazwa planu min. 3 znaki
   - Foreign keys zapewniające integralność relacji

3.6.3. Reguły biznesowe:
   - Jeden aktywny trening na użytkownika
   - Plan nie może być usunięty, jeśli istnieją aktywne treningi
   - Modyfikacje planu nie wpływają na zakończone treningi

### 3.7. Obsługa błędów

3.7.1. Toast Notifications w React/Astro:
   - Typ: Info (informacje)
   - Typ: Warning (ostrzeżenia)
   - Typ: Error (błędy)
   - Automatyczne znikanie po 5 sekundach (konfigurowalne)
   - Możliwość ręcznego zamknięcia

3.7.2. Komunikaty błędów:
   - Jasne i zrozumiałe dla użytkownika
   - W języku polskim
   - Sugerujące akcję naprawczą (jeśli możliwe)

3.7.3. Obsługa błędów sieciowych:
   - Informacja o braku połączenia z internetem
   - Automatyczne ponowienie żądania (retry logic) dla przejściowych błędów
   - Graceful degradation UI

## 4. Granice produktu

### 4.1. Co jest w zakresie MVP

4.1.1. Autoryzacja użytkowników (logowanie, rejestracja, wylogowanie)
4.1.2. CRUD dla planów treningowych
4.1.3. Predefiniowana baza 50 ćwiczeń i 5-10 kategorii
4.1.4. Logowanie treningów z modyfikacją parametrów w czasie rzeczywistym
4.1.5. Automatyczne obliczanie statystyk treningu
4.1.6. Historia treningów z filtrowaniem
4.1.7. Jeden kluczowy wykres (objętość treningowa w czasie - 4 tygodnie)
4.1.8. Jedna domyślna jednostka miary (kilogramy)
4.1.9. Opcjonalne notatki na poziomie serii w treningu
4.1.10. Responsywny design (desktop i mobile)
4.1.11. Row Level Security (RLS) w Supabase
4.1.12. Toast notifications dla obsługi błędów
4.1.13. Minimum 1 test użytkownika (Playwright)
4.1.14. Pipeline CI/CD

### 4.2. Co jest poza zakresem MVP (przyszłe wersje)

4.2.1. Timer i licznik czasu odpoczynku między seriami
4.2.2. Dodawanie własnych ćwiczeń przez użytkownika
4.2.3. Zmiana jednostki miary (funty, lbs)
4.2.4. Szablony planów treningowych (gotowe programy treningowe)
4.2.5. Zaawansowana analityka (PR - Personal Records, wykresy per ćwiczenie)
4.2.6. Social features (udostępnianie planów, community)
4.2.7. Integracje z zewnętrznymi urządzeniami (smartwatche, paski fitness)
4.2.8. Plany żywieniowe / kalkulator kalorii
4.2.9. Video instruktażowe dla ćwiczeń
4.2.10. Edycja aktywnego treningu (tylko zakończenie lub kontynuacja)
4.2.11. Eksport danych do plików (CSV, PDF)
4.2.12. Powiadomienia push (przypomnienia o treningu)
4.2.13. Tryb offline (offline-first architecture)
4.2.14. Wielojęzyczność (MVP tylko w języku polskim)
4.2.15. Tryb ciemny (dark mode)

### 4.3. Założenia i ograniczenia

4.3.1. Założenia:
   - Użytkownik ma dostęp do internetu podczas korzystania z aplikacji
   - Użytkownik korzysta z nowoczesnej przeglądarki (Chrome, Firefox, Safari, Edge - ostatnie 2 wersje)
   - Użytkownik ma podstawową znajomość ćwiczeń siłowych
   - Baza ćwiczeń jest predefiniowana i zarządzana przez administratora

4.3.2. Ograniczenia techniczne:
   - Zależność od dostępności Supabase
   - Limity free tier Supabase (jeśli dotyczy)
   - Brak wsparcia dla starszych przeglądarek (IE11)

4.3.3. Ograniczenia biznesowe:
   - Projekt realizowany w ramach wymagań kursowych
   - Ograniczony czas na rozwój (zgodnie z harmonogramem kursu)
   - MVP skupia się na core functionality bez advanced features

## 5. Historyjki użytkownika

### 5.1. Moduł autoryzacji

US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik, chcę zarejestrować się w aplikacji za pomocą adresu email i hasła, aby uzyskać dostęp do funkcji aplikacji.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, powtórzenie hasła
- Walidacja: email musi być w prawidłowym formacie
- Walidacja: hasło musi mieć minimum 8 znaków
- Walidacja: hasło i powtórzenie hasła muszą być identyczne
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- W przypadku błędu (np. email już istnieje) wyświetlany jest komunikat toast error
- Po rejestracji użytkownik jest przekierowywany do strony głównej aplikacji

US-002
Tytuł: Logowanie istniejącego użytkownika
Opis: Jako zarejestrowany użytkownik, chcę zalogować się do aplikacji za pomocą email i hasła, aby uzyskać dostęp do moich danych treningowych.
Kryteria akceptacji:
- Formularz logowania zawiera pola: email, hasło
- Walidacja: oba pola są wymagane
- Po udanym logowaniu użytkownik jest przekierowywany do strony głównej aplikacji
- Sesja użytkownika jest utrzymywana (localStorage/cookies)
- W przypadku błędnych danych wyświetlany jest komunikat toast error
- Jeśli użytkownik jest już zalogowany, przekierowanie do strony głównej

US-003
Tytuł: Wylogowanie użytkownika
Opis: Jako zalogowany użytkownik, chcę wylogować się z aplikacji, aby zabezpieczyć swoje dane na współdzielonym urządzeniu.
Kryteria akceptacji:
- Przycisk wylogowania jest widoczny w interfejsie (np. w nawigacji)
- Po kliknięciu wylogowania sesja użytkownika jest zakończona
- Użytkownik jest przekierowywany do strony logowania
- Po wylogowaniu użytkownik nie ma dostępu do chronionych stron
- Wyświetlany jest komunikat toast info potwierdzający wylogowanie

US-004
Tytuł: Ochrona chronionych tras
Opis: Jako system, chcę blokować dostęp do chronionych stron dla niezalogowanych użytkowników, aby zapewnić bezpieczeństwo danych.
Kryteria akceptacji:
- Niezalogowany użytkownik próbujący uzyskać dostęp do chronionej strony jest przekierowywany do logowania
- Po zalogowaniu użytkownik jest przekierowywany z powrotem do pierwotnie żądanej strony
- Zalogowany użytkownik ma pełny dostęp do wszystkich funkcji aplikacji
- Token autoryzacji jest sprawdzany przy każdym żądaniu do Supabase

US-005
Tytuł: Row Level Security dla danych użytkownika
Opis: Jako użytkownik, chcę mieć pewność, że tylko ja mam dostęp do swoich planów i treningów, aby chronić prywatność moich danych.
Kryteria akceptacji:
- RLS jest włączone dla tabel: workout_plans, plan_exercises, plan_exercise_sets, workouts, workout_exercises, workout_sets
- Polityki RLS zezwalają użytkownikowi na SELECT, INSERT, UPDATE, DELETE tylko dla własnych rekordów
- Próba dostępu do danych innego użytkownika kończy się błędem lub pustym wynikiem
- Weryfikacja RLS jest przeprowadzana w testach

### 5.2. Moduł bazy ćwiczeń

US-006
Tytuł: Przeglądanie bazy ćwiczeń
Opis: Jako użytkownik, chcę przeglądać pełną bazę dostępnych ćwiczeń z opisami i obrazkami, aby poznać dostępne opcje treningowe.
Kryteria akceptacji:
- Widok listy/grid wszystkich ćwiczeń (minimum 50 ćwiczeń w bazie)
- Każde ćwiczenie wyświetla: nazwę, obrazek (thumbnail), kategorię, poziom trudności
- Możliwość kliknięcia na ćwiczenie w celu wyświetlenia pełnych szczegółów
- Responsywny design (grid 1 kolumna mobile, 2-3 kolumny desktop)
- Obsługa błędu ładowania obrazków (placeholder)

US-007
Tytuł: Filtrowanie ćwiczeń po kategorii
Opis: Jako użytkownik, chcę filtrować ćwiczenia według kategorii mięśniowej, aby szybko znaleźć ćwiczenia dla konkretnej partii mięśniowej.
Kryteria akceptacji:
- Dropdown lub przyciski do wyboru kategorii (minimum 5-10 kategorii)
- Możliwość wyboru opcji "Wszystkie kategorie"
- Po wyborze kategorii lista ćwiczeń pokazuje tylko ćwiczenia z tej kategorii
- Liczba znalezionych ćwiczeń jest wyświetlana
- Filtr jest łączony z wyszukiwaniem (AND logic)

US-008
Tytuł: Filtrowanie ćwiczeń po poziomie trudności
Opis: Jako użytkownik, chcę filtrować ćwiczenia według poziomu trudności, aby dostosować trening do swojego poziomu zaawansowania.
Kryteria akceptacji:
- Możliwość wyboru poziomu trudności: Easy, Medium, Hard
- Możliwość wyboru opcji "Wszystkie poziomy"
- Możliwość wyboru wielu poziomów jednocześnie (checkboxy)
- Po zastosowaniu filtra lista pokazuje tylko ćwiczenia z wybranym poziomem
- Filtr jest łączony z kategorią i wyszukiwaniem

US-009
Tytuł: Wyszukiwanie ćwiczeń po nazwie
Opis: Jako użytkownik, chcę wyszukać ćwiczenie po nazwie, aby szybko znaleźć konkretne ćwiczenie.
Kryteria akceptacji:
- Pole tekstowe do wpisania nazwy ćwiczenia
- Wyszukiwanie działa w czasie rzeczywistym (live search) lub po naciśnięciu Enter
- Wyszukiwanie jest niewrażliwe na wielkość liter
- Wyszukiwanie działa jako "zawiera" (np. "bench" znajdzie "Bench Press")
- Wyszukiwanie jest łączone z filtrami kategorii i poziomu trudności
- Komunikat gdy brak wyników

US-010
Tytuł: Wyświetlanie szczegółów ćwiczenia
Opis: Jako użytkownik, chcę zobaczyć pełne szczegóły ćwiczenia, aby poznać technikę wykonania i parametry.
Kryteria akceptacji:
- Widok szczegółowy zawiera: nazwę, pełny obrazek, opis techniczny, kategorię, poziom trudności
- Możliwość zamknięcia widoku szczegółów (przycisk powrotu lub modal)
- Responsywny design
- Opcjonalnie: możliwość dodania ćwiczenia do planu bezpośrednio z widoku szczegółów

US-011
Tytuł: Przeglądanie kategorii ćwiczeń
Opis: Jako użytkownik, chcę zobaczyć listę wszystkich kategorii z opisami i obrazkami, aby zrozumieć organizację ćwiczeń.
Kryteria akceptacji:
- Widok grid/list wszystkich kategorii (minimum 5-10 kategorii)
- Każda kategoria wyświetla: nazwę, obrazek, opis
- Kliknięcie na kategorię przekierowuje do widoku ćwiczeń z włączonym filtrem tej kategorii
- Liczba ćwiczeń w każdej kategorii jest wyświetlana

### 5.3. Moduł zarządzania planami treningowymi

US-012
Tytuł: Tworzenie nowego planu treningowego
Opis: Jako użytkownik, chcę utworzyć nowy plan treningowy z nazwą i opisem, aby zorganizować swoje ćwiczenia.
Kryteria akceptacji:
- Formularz tworzenia planu zawiera: pole Nazwa (wymagane, min. 3 znaki), pole Opis (opcjonalne, max 500 znaków)
- Walidacja: Nazwa jest wymagana i ma minimum 3 znaki
- Przycisk "Utwórz plan" jest nieaktywny dopóki walidacja nie przejdzie
- Po utworzeniu użytkownik jest przekierowywany do ekranu edycji planu (dodawanie ćwiczeń)
- Komunikat toast success po utworzeniu planu
- Komunikat toast error w przypadku błędu

US-013
Tytuł: Dodawanie ćwiczeń do planu treningowego
Opis: Jako użytkownik, chcę dodać ćwiczenia do mojego planu treningowego wybierając je z bazy, aby zbudować kompletny trening.
Kryteria akceptacji:
- Interfejs wyboru ćwiczeń z funkcjami wyszukiwania i filtrowania (US-007, US-008, US-009)
- Możliwość dodania tego samego ćwiczenia wielokrotnie
- Lista dodanych ćwiczeń jest widoczna w planie
- Możliwość usunięcia ćwiczenia z planu
- Walidacja: Plan musi zawierać co najmniej jedno ćwiczenie przed zapisaniem
- Komunikat toast warning jeśli użytkownik próbuje zapisać plan bez ćwiczeń

US-014
Tytuł: Zmiana kolejności ćwiczeń w planie
Opis: Jako użytkownik, chcę zmienić kolejność ćwiczeń w moim planie, aby dopasować strukturę treningu do swoich preferencji.
Kryteria akceptacji:
- Możliwość przesuwania ćwiczeń w górę lub w dół (przyciski strzałek lub drag-and-drop)
- Kolejność ćwiczeń jest natychmiast aktualizowana wizualnie
- Kolejność jest zapisywana po zapisaniu planu
- Kolejność jest zachowana podczas wykonywania treningu na bazie planu

US-015
Tytuł: Dodawanie serii do ćwiczenia w planie
Opis: Jako użytkownik, chcę dodać jedną lub więcej serii do ćwiczenia w planie z określonymi powtórzeniami i ciężarem, aby zaplanować strukturę treningu.
Kryteria akceptacji:
- Dla każdego ćwiczenia w planie możliwość dodania wielu serii
- Formularz dodawania serii zawiera: Powtórzenia (wymagane, >0), Ciężar (opcjonalne, ≥0)
- Walidacja: Powtórzenia muszą być większe od 0
- Walidacja: Ciężar (jeśli podany) musi być ≥ 0
- Jednostka ciężaru: kilogramy (kg) - wyświetlona przy polu
- Przycisk "Dodaj serię"
- Lista dodanych serii jest widoczna pod ćwiczeniem
- Komunikat toast error w przypadku błędnych danych

US-016
Tytuł: Usuwanie serii z ćwiczenia w planie
Opis: Jako użytkownik, chcę usunąć serię z ćwiczenia w planie, aby skorygować strukturę treningu.
Kryteria akceptacji:
- Przycisk usunięcia przy każdej serii
- Seria jest natychmiast usuwana po kliknięciu (lub potwierdzeniu)
- Możliwość usunięcia wszystkich serii dla ćwiczenia (ale nie samego ćwiczenia bez usunięcia)
- Opcjonalnie: Dialog potwierdzenia usunięcia

US-017
Tytuł: Edycja parametrów serii w planie
Opis: Jako użytkownik, chcę edytować parametry serii (powtórzenia, ciężar) w planie treningowym, aby dostosować trening do mojego postępu.
Kryteria akceptacji:
- Możliwość edycji inline lub poprzez formularz edycji
- Walidacja identyczna jak przy dodawaniu serii (US-015)
- Zmiany są zapisywane po kliknięciu "Zapisz" lub automatycznie (debounce)
- Komunikat toast success po zapisaniu zmian
- Komunikat toast error w przypadku błędnych danych

US-018
Tytuł: Przeglądanie listy planów treningowych
Opis: Jako użytkownik, chcę zobaczyć listę wszystkich moich planów treningowych, aby wybrać plan do edycji lub wykonania treningu.
Kryteria akceptacji:
- Widok listy/grid wszystkich planów użytkownika
- Każdy plan wyświetla: nazwę, opis (skrócony), liczbę ćwiczeń, datę utworzenia
- Możliwość sortowania po: dacie utworzenia (najnowsze/najstarsze), nazwie (A-Z)
- Możliwość wyszukiwania planu po nazwie
- Przyciski akcji: Edytuj, Usuń, Rozpocznij trening
- Komunikat gdy użytkownik nie ma żadnych planów

US-019
Tytuł: Edycja istniejącego planu treningowego
Opis: Jako użytkownik, chcę edytować istniejący plan treningowy (nazwa, opis, ćwiczenia, serie), aby dostosować go do mojego aktualnego poziomu.
Kryteria akceptacji:
- Możliwość edycji nazwy i opisu planu
- Możliwość dodawania/usuwania ćwiczeń (US-013)
- Możliwość dodawania/usuwania/edycji serii (US-015, US-016, US-017)
- Możliwość zmiany kolejności ćwiczeń (US-014)
- Przycisk "Zapisz zmiany"
- WAŻNE: Zmiany nie wpływają na zakończone historyczne treningi
- Komunikat toast success po zapisaniu zmian
- Komunikat toast error w przypadku błędu

US-020
Tytuł: Usuwanie planu treningowego
Opis: Jako użytkownik, chcę usunąć plan treningowy, którego już nie potrzebuję, aby utrzymać porządek w aplikacji.
Kryteria akceptacji:
- Przycisk "Usuń" przy każdym planie na liście
- Dialog potwierdzenia usunięcia z ostrzeżeniem
- Jeśli istnieją zakończone treningi powiązane z planem, wyświetlane jest dodatkowe ostrzeżenie
- Jeśli istnieje aktywny trening powiązany z planem, usunięcie jest blokowane z komunikatem błędu
- Po potwierdzeniu plan jest usuwany (soft delete lub hard delete zgodnie z implementacją)
- Komunikat toast success po usunięciu
- Użytkownik pozostaje na liście planów

US-021
Tytuł: Wyświetlanie szczegółów planu treningowego
Opis: Jako użytkownik, chcę zobaczyć pełne szczegóły planu treningowego przed rozpoczęciem treningu, aby wiedzieć czego się spodziewać.
Kryteria akceptacji:
- Widok szczegółowy planu zawiera: nazwę, opis, listę wszystkich ćwiczeń
- Dla każdego ćwiczenia wyświetlane są: nazwa, obrazek, lista serii (powtórzenia, ciężar)
- Łączna liczba serii w planie
- Łączna liczba ćwiczeń w planie
- Przycisk "Rozpocznij trening" (przekierowanie do US-022)
- Przycisk "Edytuj plan"
- Przycisk powrotu do listy planów

### 5.4. Moduł logowania treningu

US-022
Tytuł: Rozpoczęcie treningu na podstawie planu
Opis: Jako użytkownik, chcę rozpocząć trening na podstawie wybranego planu, aby logować wykonane ćwiczenia.
Kryteria akceptacji:
- Wybór planu z listy lub z widoku szczegółów planu (US-021)
- Przycisk "Rozpocznij trening"
- System sprawdza czy istnieje już aktywny trening
- Jeśli istnieje aktywny trening, wyświetlany jest komunikat toast error i opcja: Kontynuuj aktywny trening lub Zakończ i rozpocznij nowy
- Jeśli nie ma aktywnego treningu, tworzony jest nowy trening z:
  - Data i godzina rozpoczęcia (automatycznie)
  - Kopiowanie ćwiczeń i serii z planu jako podstawa do logowania
  - Status: Aktywny
- Użytkownik jest przekierowywany do interfejsu logowania treningu
- Komunikat toast success: "Trening rozpoczęty"

US-023
Tytuł: Logowanie wykonanej serii podczas treningu
Opis: Jako użytkownik, chcę oznaczać serie jako wykonane i opcjonalnie modyfikować ich parametry podczas treningu, aby rejestrować rzeczywiste wykonanie.
Kryteria akceptacji:
- Widok aktywnego treningu pokazuje listę ćwiczeń i serii zgodnie z planem
- Dla każdej serii wyświetlane są: planowane powtórzenia, planowany ciężar (jeśli był)
- Możliwość modyfikacji rzeczywistych powtórzeń (wartość >0)
- Możliwość modyfikacji rzeczywistego ciężaru (wartość ≥0)
- Duży przycisk/checkbox do oznaczenia serii jako wykonanej
- Wizualne rozróżnienie serii wykonanych vs. niewykonanych (np. kolor, strikethrough)
- Automatyczne zapisywanie zmian (debounce) lub przycisk "Zapisz"
- Licznik: wykonanych serii / całkowita liczba serii

US-024
Tytuł: Dodawanie notatki do serii podczas treningu
Opis: Jako użytkownik, chcę dodać opcjonalną notatkę tekstową do serii, aby zapisać dodatkowe informacje (np. odczucia, trudność).
Kryteria akceptacji:
- Opcjonalne pole tekstowe "Notatka" przy każdej serii
- Maksymalna długość notatki: 200 znaków
- Licznik pozostałych znaków
- Notatka jest zapisywana wraz z serią
- Notatka jest widoczna w podsumowaniu treningu i historii

US-025
Tytuł: Dodawanie dodatkowych serii do ćwiczenia podczas treningu
Opis: Jako użytkownik, chcę dodać dodatkową serię do ćwiczenia podczas treningu, jeśli czuję się na siłach wykonać więcej niż planowałem.
Kryteria akceptacji:
- Przycisk "Dodaj serię" pod każdym ćwiczeniem w aktywnym treningu
- Formularz dodawania serii identyczny jak w planie (US-015)
- Nowa seria pojawia się na liście serii dla tego ćwiczenia
- Nowa seria może być natychmiast zalogowana (oznaczona jako wykonana)
- Dodane serie są uwzględniane w statystykach treningu

US-026
Tytuł: Przejście do poprzedniego/następnego ćwiczenia podczas treningu
Opis: Jako użytkownik, chcę łatwo nawigować między ćwiczeniami podczas treningu, aby szybko logować postępy.
Kryteria akceptacji:
- Widok aktywnego treningu może pokazywać jedno ćwiczenie na raz lub wszystkie (decyzja UX)
- Jeśli jedno na raz: przyciski "Poprzednie" i "Następne"
- Możliwość szybkiego powrotu do dowolnego ćwiczenia (np. menu/tabs)
- Wizualna informacja o postępie (np. ćwiczenie 2/5)
- Autoscroll do aktualnego ćwiczenia

US-027
Tytuł: Zakończenie treningu
Opis: Jako użytkownik, chcę zakończyć trening, aby zapisać wyniki i zobaczyć podsumowanie.
Kryteria akceptacji:
- Przycisk "Zakończ trening" widoczny w interfejsie logowania
- Dialog potwierdzenia zakończenia: "Czy na pewno chcesz zakończyć trening?"
- Po potwierdzeniu:
  - Data i godzina zakończenia jest zapisywana (automatycznie)
  - Obliczane są statystyki treningu (US-028)
  - Status treningu zmienia się na "Zakończony"
- Użytkownik jest przekierowywany do widoku podsumowania treningu
- Komunikat toast success: "Trening zakończony"

US-028
Tytuł: Automatyczne obliczanie statystyk treningu
Opis: Jako system, chcę automatycznie obliczyć statystyki treningu po jego zakończeniu, aby dostarczyć użytkownikowi podsumowanie.
Kryteria akceptacji:
- Obliczenia wykonywane są po zakończeniu treningu (US-027)
- Obliczane statystyki:
  - Całkowity czas trwania: (Data zakończenia - Data rozpoczęcia) w minutach
  - Liczba wykonanych ćwiczeń (unikalne)
  - Łączna liczba wykonanych serii (tylko serie oznaczone jako wykonane)
  - Łączna liczba powtórzeń: Σ(Powtórzenia) dla wszystkich wykonanych serii
  - Maksymalny ciężar: MAX(Ciężar) z wszystkich wykonanych serii
  - Całkowita objętość treningowa: Σ(Ciężar × Powtórzenia) dla wszystkich wykonanych serii z ciężarem
- Statystyki są zapisywane w tabeli workouts lub w osobnej tabeli workout_stats
- Jeśli wszystkie serie są bez ciężaru, objętość = 0

US-029
Tytuł: Wyświetlanie podsumowania zakończonego treningu
Opis: Jako użytkownik, chcę zobaczyć podsumowanie swojego treningu zaraz po zakończeniu, aby ocenić swoją wydajność.
Kryteria akceptacji:
- Widok podsumowania zawiera:
  - Nazwa użytego planu treningowego
  - Data i godzina rozpoczęcia
  - Data i godzina zakończenia
  - Całkowity czas trwania (format: Xh Ymin lub Xmin)
  - Liczba wykonanych ćwiczeń
  - Łączna liczba wykonanych serii
  - Łączna liczba powtórzeń
  - Maksymalny ciężar (kg)
  - Całkowita objętość treningowa (kg)
- Lista wykonanych ćwiczeń z liczbą serii dla każdego
- Przycisk "Wróć do strony głównej"
- Przycisk "Zobacz historię treningów"

US-030
Tytuł: Kontynuacja aktywnego treningu
Opis: Jako użytkownik, chcę kontynuować rozpoczęty, ale niezakończony trening, jeśli wyjdę z aplikacji podczas treningu.
Kryteria akceptacji:
- Po zalogowaniu system sprawdza czy użytkownik ma aktywny trening
- Jeśli tak, wyświetlany jest komunikat/banner: "Masz aktywny trening rozpoczęty [data, godzina]. [Kontynuuj] [Zakończ]"
- Przycisk "Kontynuuj" przekierowuje do interfejsu logowania aktywnego treningu
- Przycisk "Zakończ" pyta o potwierdzenie i kończy trening (US-027)
- Aktywny trening ma priorytet przed rozpoczęciem nowego (US-022)

### 5.5. Moduł historii i statystyk

US-031
Tytuł: Przeglądanie historii wszystkich treningów
Opis: Jako użytkownik, chcę zobaczyć listę wszystkich moich zakończonych treningów, aby śledzić swoją aktywność.
Kryteria akceptacji:
- Widok listy wszystkich zakończonych treningów użytkownika
- Sortowanie domyślne: od najnowszych
- Dla każdego treningu wyświetlane są:
  - Data treningu (format: dd.mm.yyyy)
  - Godzina rozpoczęcia
  - Nazwa użytego planu
  - Czas trwania (Xmin lub Xh Ymin)
  - Objętość treningowa (kg)
  - Liczba ćwiczeń
- Możliwość kliknięcia na trening w celu wyświetlenia szczegółów (US-032)
- Responsywny design (lista na mobile, tabela na desktop)
- Komunikat gdy użytkownik nie ma żadnych treningów

US-032
Tytuł: Wyświetlanie szczegółów historycznego treningu
Opis: Jako użytkownik, chcę zobaczyć pełne szczegóły zakończonego treningu, aby przeanalizować swoje wykonanie.
Kryteria akceptacji:
- Widok szczegółowy treningu zawiera wszystkie statystyki z podsumowania (US-029)
- Dodatkowo: szczegółowa lista wszystkich wykonanych serii:
  - Nazwa ćwiczenia
  - Numer serii
  - Powtórzenia (planowane vs. rzeczywiste)
  - Ciężar (planowany vs. rzeczywisty)
  - Status wykonania (wykonane/pominięte)
  - Notatka (jeśli była dodana)
- Możliwość wyeksportowania danych (poza zakresem MVP - placeholder)
- Przycisk powrotu do historii treningów

US-033
Tytuł: Filtrowanie historii treningów po planie treningowym
Opis: Jako użytkownik, chcę filtrować historię treningów według planu treningowego, aby zobaczyć postępy dla konkretnego programu treningowego.
Kryteria akceptacji:
- Dropdown do wyboru planu treningowego
- Opcja "Wszystkie plany"
- Po wyborze planu lista pokazuje tylko treningi wykonane na bazie tego planu
- Liczba znalezionych treningów jest wyświetlana
- Filtr jest łączony z filtrem dat (jeśli istnieje)

US-034
Tytuł: Filtrowanie historii treningów po zakresie dat
Opis: Jako użytkownik, chcę filtrować historię treningów według zakresu dat, aby zobaczyć treningi z określonego okresu.
Kryteria akceptacji:
- Data picker lub dwa pola: Data od, Data do
- Możliwość wybrania predefiniowanych zakresów: Ostatnie 7 dni, Ostatnie 30 dni, Ostatnie 3 miesiące
- Możliwość wyczyszczenia filtra (Wszystkie daty)
- Po zastosowaniu filtra lista pokazuje tylko treningi z wybranego zakresu
- Filtr jest łączony z filtrem planu (jeśli istnieje)

US-035
Tytuł: Wyświetlanie wykresu objętości treningowej w czasie
Opis: Jako użytkownik, chcę zobaczyć wykres pokazujący moją całkowitą objętość treningową w czasie, aby wizualnie śledzić postępy.
Kryteria akceptacji:
- Wykres liniowy lub słupkowy pokazujący objętość treningową (kg) na osi Y
- Oś X: Data treningu
- Domyślny zakres: Ostatnie 4 tygodnie
- Każdy punkt/słupek reprezentuje jeden trening
- Możliwość najechania na punkt/słupek w celu wyświetlenia szczegółów (tooltip: data, objętość)
- Wykres jest responsywny
- Jeśli brak danych, wyświetlany jest komunikat: "Wykonaj trening, aby zobaczyć wykres"

US-036
Tytuł: Zmiana zakresu czasowego wykresu
Opis: Jako użytkownik, chcę zmienić zakres czasowy wykresu objętości, aby analizować postępy z różnych okresów.
Kryteria akceptacji:
- Przyciski/dropdown do wyboru zakresu: Ostatnie 7 dni, Ostatnie 4 tygodnie (domyślny), Ostatnie 3 miesiące, Ostatni rok
- Wykres jest automatycznie aktualizowany po zmianie zakresu
- Jeśli w wybranym zakresie nie ma treningów, wyświetlany jest komunikat

### 5.6. Moduł obsługi błędów i UX

US-037
Tytuł: Wyświetlanie komunikatów toast dla informacji
Opis: Jako użytkownik, chcę otrzymywać natychmiastową informację zwrotną o wykonanych akcjach, aby wiedzieć czy operacja się powiodła.
Kryteria akceptacji:
- Toast notification typu "info" dla informacji (np. "Trening rozpoczęty")
- Toast notification typu "success" dla pomyślnych operacji (np. "Plan zapisany")
- Toast notification typu "warning" dla ostrzeżeń (np. "Plan musi zawierać co najmniej jedno ćwiczenie")
- Toast notification typu "error" dla błędów (np. "Nie udało się zapisać planu")
- Komunikaty w języku polskim
- Automatyczne znikanie po 5 sekundach (konfigurowalne)
- Możliwość ręcznego zamknięcia (przycisk X)
- Możliwość wyświetlenia wielu toastów jednocześnie (stack)

US-038
Tytuł: Obsługa błędów sieciowych
Opis: Jako użytkownik, chcę być poinformowany o problemach z połączeniem, aby zrozumieć dlaczego aplikacja nie działa.
Kryteria akceptacji:
- Wykrywanie braku połączenia z internetem
- Wyświetlanie toast error: "Brak połączenia z internetem. Sprawdź swoje połączenie."
- Automatyczne ponowienie żądania (retry logic) dla przejściowych błędów (np. timeout) - maksymalnie 3 próby
- Wyświetlanie ogólnego komunikatu błędu dla błędów serwera: "Wystąpił problem z serwerem. Spróbuj ponownie później."
- Graceful degradation: aplikacja nie crashuje, użytkownik może wyjść z błędnej operacji

US-039
Tytuł: Walidacja formularzy w czasie rzeczywistym
Opis: Jako użytkownik, chcę otrzymywać natychmiastową informację o błędach w formularzach, aby szybko je poprawić.
Kryteria akceptacji:
- Walidacja pól formularza w czasie rzeczywistym (on blur lub on change)
- Wyświetlanie komunikatów błędów pod polem formularza (np. "To pole jest wymagane", "Wartość musi być większa od 0")
- Wizualne oznaczenie nieprawidłowych pól (czerwona ramka, ikona)
- Przycisk submit jest nieaktywny dopóki formularz jest nieprawidłowy
- Komunikaty błędów w języku polskim

US-040
Tytuł: Loading states podczas operacji asynchronicznych
Opis: Jako użytkownik, chcę widzieć wskaźnik ładowania podczas długotrwałych operacji, aby wiedzieć że aplikacja pracuje.
Kryteria akceptacji:
- Spinner lub skeleton loader podczas ładowania danych
- Wyłączenie przycisków podczas operacji (np. "Zapisz" staje się "Zapisywanie...")
- Loading state dla listy ćwiczeń, planów, historii treningów
- Timeout: jeśli operacja trwa dłużej niż 30 sekund, wyświetlany jest komunikat błędu

### 5.7. Moduł responsywności i UX mobilny

US-041
Tytuł: Responsywny interfejs dla urządzeń mobilnych
Opis: Jako użytkownik korzystający z telefonu, chcę mieć dostęp do wszystkich funkcji aplikacji w wygodnym interfejsie mobilnym.
Kryteria akceptacji:
- Aplikacja działa poprawnie na urządzeniach mobilnych (ekrany ≥320px szerokości)
- Responsywny layout: 1 kolumna na mobile, 2-3 kolumny na tablet/desktop
- Touch-friendly UI: duże przyciski (min. 44x44px), odpowiednie odstępy
- Brak poziomego scrollowania (chyba że zamierzonego, np. karuzela)
- Testowane na rzeczywistych urządzeniach lub emulatorach (iOS Safari, Android Chrome)

US-042
Tytuł: Szybkie logowanie treningu na telefonie
Opis: Jako użytkownik trenujący na siłowni, chcę szybko logować serie podczas treningu za pomocą telefonu, bez zbędnych gestów.
Kryteria akceptacji:
- Duże przyciski do oznaczenia serii jako wykonanej (min. 44x44px)
- Pola do modyfikacji ciężaru/powtórzeń są łatwo dostępne (duże, responsywne na touch)
- Możliwość szybkiego uzupełnienia wartości z planu (przycisk "Użyj planu" lub automatyczne)
- Klawiatura numeryczna otwiera się automatycznie dla pól liczbowych
- Minimalna liczba kliknięć do zalogowania serii (ideał: 1-2 kliknięcia)

US-043
Tytuł: Nawigacja mobilna
Opis: Jako użytkownik mobilny, chcę łatwo nawigować między głównymi sekcjami aplikacji, aby szybko dostać się do potrzebnej funkcji.
Kryteria akceptacji:
- Dolna nawigacja (bottom nav) lub hamburger menu na mobile
- Główne sekcje: Strona główna, Plany, Aktywny trening (jeśli istnieje), Historia, Profil
- Aktywna sekcja jest wizualnie wyróżniona
- Responsywna nawigacja: bottom nav na mobile, top nav na desktop

### 5.8. Moduł bezpieczeństwa i prywatności

US-044
Tytuł: Walidacja danych na poziomie bazy danych
Opis: Jako system, chcę walidować dane na poziomie bazy danych, aby zapewnić integralność danych niezależnie od źródła żądania.
Kryteria akceptacji:
- Constraint w bazie: Powtórzenia > 0 (CHECK constraint)
- Constraint w bazie: Ciężar ≥ 0 (CHECK constraint, jeśli pole nie jest NULL)
- Constraint w bazie: Nazwa planu min. 3 znaki (CHECK constraint)
- Foreign keys zapewniające integralność relacji (np. plan_exercises.plan_id REFERENCES workout_plans.id)
- NOT NULL dla wszystkich wymaganych pól
- Unikalność: email użytkownika (handled by Supabase Auth)

US-045
Tytuł: Audyt logów dostępu do danych
Opis: Jako administrator, chcę mieć możliwość audytu dostępu do wrażliwych danych, aby zapewnić bezpieczeństwo aplikacji.
Kryteria akceptacji:
- Opcjonalne: Supabase automatycznie loguje zapytania w panelu administracyjnym
- Opcjonalne: Implementacja triggerów do logowania krytycznych operacji (INSERT, UPDATE, DELETE na wrażliwych tabelach)
- Możliwość przeglądu logów w panelu Supabase
- (To jest funkcja bardziej dla administratora niż użytkownika końcowego - opcjonalne w MVP)

### 5.9. Moduł testowania i jakości

US-046
Tytuł: Test użytkownika dla krytycznej ścieżki treningu
Opis: Jako zespół deweloperski, chcę zautomatyzować test krytycznej ścieżki użytkownika, aby zapewnić poprawność działania core functionality.
Kryteria akceptacji:
- Test E2E (Playwright) obejmujący:
  1. Logowanie użytkownika testowego
  2. Utworzenie planu treningowego z co najmniej 2 ćwiczeniami i 3 seriami każde
  3. Rozpoczęcie treningu na podstawie tego planu
  4. Modyfikacja ciężaru/powtórzeń dla co najmniej 1 serii
  5. Oznaczenie wszystkich serii jako wykonanych
  6. Zakończenie treningu
  7. Weryfikacja podsumowania:
     - Czas trwania > 0
     - Objętość treningowa jest obliczona poprawnie (Σ(Ciężar × Powtórzenia))
     - Liczba ćwiczeń = 2
     - Liczba serii = 6
- Test przechodzi w 100% przypadków
- Test jest częścią pipeline CI/CD

US-047
Tytuł: Test RLS dla izolacji danych użytkowników
Opis: Jako zespół deweloperski, chcę przetestować Row Level Security, aby zapewnić że użytkownicy nie mają dostępu do cudzych danych.
Kryteria akceptacji:
- Test jednostkowy lub integracyjny sprawdzający:
  1. Użytkownik A tworzy plan treningowy
  2. Użytkownik B próbuje odczytać plan użytkownika A
  3. Weryfikacja: Użytkownik B nie ma dostępu (błąd lub puste wyniki)
  4. Użytkownik A może odczytać swój plan
- Test dla wszystkich tabel z RLS (workout_plans, workouts, etc.)
- Test jest częścią pipeline CI/CD

## 6. Metryki sukcesu

### 6.1. Kluczowe wskaźniki wydajności (KPI)

6.1.1. Wskaźniki funkcjonalne (MVP):
- 100% krytycznych historyjek użytkownika zaimplementowanych i przetestowanych (US-001 do US-030 jako minimum)
- Test krytycznej ścieżki treningu (US-046) przechodzi w 100% przypadków
- RLS jest włączone i przetestowane dla wszystkich wrażliwych tabel (US-047)
- Minimum 50 ćwiczeń i 5 kategorii w bazie danych
- Walidacja danych działa poprawnie na UI i w bazie danych

6.1.2. Wskaźniki jakości:
- Zero krytycznych bugów w produkcji
- Czas odpowiedzi aplikacji < 2 sekundy dla 95% żądań
- Aplikacja działa poprawnie na: Chrome, Firefox, Safari (ostatnie 2 wersje)
- Responsywny design działa poprawnie na ekranach ≥320px

6.1.3. Wskaźniki kursu:
- Wszystkie obowiązkowe wymagania kursowe spełnione:
  - Logowanie i autoryzacja ✓
  - Operacje CRUD ✓
  - Logika biznesowa ✓
  - Dokumentacja (PRD, specyfikacje techniczne) ✓
  - Testy (minimum 1 test użytkownika) ✓
  - Pipeline CI/CD ✓
- Opcjonalne: Publiczny URL aplikacji
- Opcjonalne: Możliwość instalacji jako PWA

### 6.2. Metryki użytkownika (post-MVP)

6.2.1. Adopcja:
- Liczba zarejestrowanych użytkowników
- Procent użytkowników, którzy utworzyli co najmniej 1 plan treningowy
- Procent użytkowników, którzy wykonali co najmniej 1 trening

6.2.2. Engagement:
- Średnia liczba treningów na użytkownika tygodniowo
- Średni czas spędzony w aplikacji podczas treningu
- Procent użytkowników powracających w ciągu 7 dni od rejestracji

6.2.3. Retencja:
- Retention Rate: Procent użytkowników aktywnych po 1 miesiącu, 3 miesiącach
- Churn Rate: Procent użytkowników, którzy przestali korzystać z aplikacji

### 6.3. Metryki techniczne

6.3.1. Wydajność:
- Page Load Time < 3 sekundy (dla pierwszego ładowania)
- Time to Interactive < 5 sekund
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

6.3.2. Dostępność:
- Uptime: 99% (cel)
- Error Rate < 1% wszystkich żądań

6.3.3. Bezpieczeństwo:
- Zero naruszeń bezpieczeństwa danych użytkowników
- 100% wrażliwych tabel chronionych przez RLS
- Wszystkie hasła szyfrowane (handled by Supabase Auth)

### 6.4. Kryteria akceptacji MVP

Projekt MVP jest uważany za ukończony, gdy:
1. Wszystkie historyjki użytkownika z sekcji 5.1-5.5 (US-001 do US-036) są zaimplementowane i przetestowane
2. Test krytycznej ścieżki (US-046) przechodzi pomyślnie
3. Test RLS (US-047) przechodzi pomyślnie
4. Dokumentacja jest kompletna (PRD, specyfikacja techniczna)
5. Pipeline CI/CD jest skonfigurowany i działa
6. Aplikacja jest wdrożona (opcjonalnie z publicznym URL)
7. Wszystkie obowiązkowe wymagania kursowe są spełnione
8. Zero krytycznych bugów w środowisku produkcyjnym

### 6.5. Warunki sukcesu projektu

Projekt jest uznawany za sukces, gdy:
1. MVP jest ukończone zgodnie z kryteriami akceptacji (6.4)
2. Aplikacja spełnia wszystkie wymagania kursowe
3. Użytkownik testowy (wykładowca/recenzent) jest w stanie:
   - Zarejestrować się i zalogować
   - Utworzyć plan treningowy
   - Wykonać trening na podstawie planu
   - Zobaczyć podsumowanie i historię treningów
   - Zobaczyć wykres postępów
4. Dokumentacja jest kompletna i zrozumiała
5. Kod jest czytelny, zorganizowany i zgodny z dobrymi praktykami
6. Projekt demonstruje znajomość technologii: Astro, React, Supabase, CI/CD

---

Koniec dokumentu PRD - Gym Track MVP v1.0
