const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  modulePathIgnorePatterns: ['<rootDir>/.next/standalone/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Rodar todos os testes padrão do Jest (sem filtro unit-only)
  // Se quiser rodar subset, defina testMatch no CLI, não aqui.
  // TASK-013: Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/next.config.js',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
  
  coverageDirectory: 'coverage',

  // Ignore E2E/Playwright specs and heavy app router tests in Jest (those run in Playwright)
  testPathIgnorePatterns: [
    '<rootDir>/tests/',
    '<rootDir>/e2e/',
    '<rootDir>/playwright-report/',
    '<rootDir>/.next/',
    '<rootDir>/app/__tests__/', // app-router server components not runnable in JSDOM
    '<rootDir>/__tests__/pages/', // page-level integration tests rely on Next runtime
    '<rootDir>/__tests__/app/', // app directory integration tests
    '<rootDir>/app/.*/__tests__/', // nested app route tests
    '<rootDir>/cypress/', // Cypress specs run in Cypress, not Jest
  ],

  // Allow mocking ESM packages that break in Jest (better-auth)
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/components/Skeleton$': '<rootDir>/components/ui/Skeleton',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/store/(.*)$': '<rootDir>/store/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types$': '<rootDir>/types',
    '^better-auth/client$': '<rootDir>/__mocks__/better-auth-client.js',
  },
};

module.exports = createJestConfig(customJestConfig);
