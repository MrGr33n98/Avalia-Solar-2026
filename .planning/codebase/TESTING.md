# Testing

## Frontend (AB0-1-front)
- **Unit Testing:** Jest and `@testing-library/react` (configured in `test`, `test:watch`).
- **E2E Testing:** Playwright (`@playwright/test`).
- **Static Analysis:** TypeScript compilation (`tsc --noEmit`), ESLint.
- Next.js environment mocked using `jest-environment-jsdom`.
- Visual inspection checking AS-EDS components validation.

## Backend (AB0-1-back)
- **Framework:** RSpec (`.rspec`, `spec/` folder usage) coupled with factory gem/bots generally setup in standard Rails API applications.
- **Continuous Integration:** Standard test runs checking ActiveAdmin setups, custom Services triggers (like the Lead Generation tests), and validations over complex Trust Score algorithms.
- **Coverage Check:** RuboCop syntax analyzers are consistently run against `.rubocop.yml` strict definitions.
