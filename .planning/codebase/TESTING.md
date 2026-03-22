# Testing

## Frameworks
- **Unit Testing:** Jest and `@testing-library/react` (configured in `test`, `test:watch`).
- **E2E Testing:** Playwright (`@playwright/test`).
- **Static Analysis:** TypeScript compilation (`tsc --noEmit`), ESLint.

## Coverage
- Supports `jest --coverage` to evaluate code execution paths on continuous integration.

## Strategies
- Next.js environment mocked using `jest-environment-jsdom`.
- High degree of visual inspection / user feedback based QA (trust metrics and component layout validation).
