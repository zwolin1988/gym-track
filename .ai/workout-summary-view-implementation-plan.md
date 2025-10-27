# Plan implementacji widoku podsumowania treningu

## ⚠️ PRZESTARZAŁY - ZASTĄPIONY PRZEZ WIDOK SZCZEGÓŁÓW TRENINGU

**Data dezaktualizacji:** 2025-10-27

**Powód:** Zdecydowano, że zamiast osobnego widoku podsumowania (`/workouts/[id]/summary`), użytkownicy będą przekierowywani bezpośrednio do widoku szczegółów treningu (`/workouts/[id]`), który zawiera wszystkie niezbędne informacje o ukończonym treningu.

**Nowa implementacja:**
- Ścieżka: `/workouts/[id]` (zaimplementowana w `src/pages/workouts/[id].astro`)
- Funkcjonalność: Wyświetla pełne szczegóły treningu (zarówno ukończonego jak i historycznego)
- Zawiera wszystkie elementy z oryginalnego planu: statystyki, listę ćwiczeń, serie, akcje

**Co się zmieniło:**
1. Użytkownik po zakończeniu treningu jest przekierowywany na `/workouts/[id]` zamiast `/workouts/[id]/summary`
2. Widok `/workouts/[id]` obsługuje zarówno historyczne treningi (z listy historii) jak i świeżo zakończone treningi
3. Komponenty dashboardu (`WorkoutSummaryCard`, `LastWorkoutSummary`) używają linków do `/workouts/[id]`

**Powiązane zmiany:**
- `src/components/workouts/ActiveWorkoutContainer.tsx` - zmieniono przekierowanie
- `src/components/dashboard/WorkoutSummaryCard.tsx` - zaktualizowano linki
- `src/components/dashboard/LastWorkoutSummary.tsx` - zaktualizowano linki
- `.ai/prd.md` - zaktualizowano US-027 i US-029

---

# Oryginalny plan (dla referencji historycznej)

[Reszta dokumentu pozostaje bez zmian dla celów historycznych...]
