## Frontend
- Astro 5: Pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript.
- React 19: Zapewnia interaktywność tam, gdzie jest potrzebna, umożliwiając tworzenie dynamicznych komponentów.
- TypeScript 5: Stosowany dla statycznego typowania kodu, co wspiera rozwój i utrzymanie wysokiej jakości kodu.
- Tailwind 4 CSS: Umożliwia wygodne i efektywne stylowanie aplikacji przy użyciu gotowych klas.
- Shadcn/ui: Zapewnia bibliotekę dostępnych komponentów React, która stanowi podstawę UI.

## Backend
- Supabase: Kompleksowe rozwiązanie backendowe, które oferuje:
  - Bazę danych PostgreSQL
  - SDK w wielu językach działające jako Backend-as-a-Service
  - Możliwość hostowania lokalnie lub na własnym serwerze dzięki rozwiązaniu open source
  - Wbudowaną autentykację użytkowników

## AI
- Openrouter.ai: Umożliwia komunikację z modelami AI, oferując dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wielu innych).
  - Pozwala na ustawianie limitów finansowych dla kluczy API, co zapewnia kontrolę nad kosztami

## Testy
- **Vitest 2.x**: Framework do testów jednostkowych i integracyjnych z natywnym wsparciem TypeScript i ESM
  - Szybkie wykonanie testów dzięki Vite
  - Kompatybilny API z Jest
  - Wbudowane code coverage (c8)
- **React Testing Library 16.x**: Testowanie komponentów React z perspektywy użytkownika
  - User-centric testing approach
  - Integracja z Vitest
  - Custom matchers dla DOM (@testing-library/jest-dom)
- **Playwright 1.50+**: Nowoczesne testy end-to-end i wydajnościowe
  - Wsparcie dla Chrome, Firefox, Safari, Edge
  - Testy cross-browser i multi-device
  - Performance testing API
  - Screenshot i video recording

## CI/CD i Hosting
- GitHub Actions: Automatyzuje proces budowy pipeline'ów CI/CD, co przyspiesza wdrażanie zmian.
- DigitalOcean: Hostowanie aplikacji za pośrednictwem obrazów Docker, gwarantujące skalowalność oraz wydajność.