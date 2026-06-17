# Coding Conventions

**Analysis Date:** 2025-02-13

## Naming Patterns

**Files:**
- Routes in `src/app`: mix of kebab-case (`p2p_chat`) and simple names (`index.tsx`).
- Components: kebab-case (`themed-text.tsx`) or PascalCase (`MobileRadiusFilter.tsx`).

**Functions:**
- CamelCase for standard functions and hooks (e.g., `fetchApi`, `useTracking`).

**Variables:**
- CamelCase for standard variables.
- UPPER_SNAKE_CASE for constants (e.g., `DEFAULT_LOCAL_API`).

**Types:**
- PascalCase for interfaces and types (e.g., `Company`, `Category`).

## Code Style

**Formatting:**
- Uses standard Prettier/ESLint defaults for React Native projects.

**Linting:**
- Configured via `expo lint`.

## Import Organization

**Order:**
1. React and standard libraries.
2. Third-party libraries (Expo, Lucide, TanStack Query).
3. Local components (`@/components/...`).
4. Local services/lib (`@/lib/...`).
5. Local constants/styles.

**Path Aliases:**
- `@/` maps to `src/` (configured in `tsconfig.json`).

## Error Handling

**Patterns:**
- Centralized `fetchApi` in `src/lib/api.ts` handles network and status errors, throwing a structured error object.
- UI uses `try...catch` for specific operations or relies on React Query's error handling.

## Logging

**Framework:** `console.log` and `console.error` are used throughout `src/lib/api.ts` for debugging requests and responses.

**Patterns:**
- `[API Request] -> METHOD URL`
- `[API Error] <- status: CODE, message: MSG`

## Comments

**When to Comment:**
- Used to separate sections in service files (e.g., `// Interfaces`, `// Cliente de API`).
- Used to explain specific workarounds (e.g., Android emulator IP `10.0.2.2`).

## Function Design

**Size:** Most screen components are relatively large (200-500 lines) including styles.

**Parameters:** API functions usually take an object for optional parameters.

**Return Values:** API functions return typed Promises.

## Module Design

**Exports:**
- Named exports for service methods in `src/lib/api.ts`.
- Default exports for screen components in `src/app/`.

**Barrel Files:**
- Not extensively used.

---

*Convention analysis: 2025-02-13*
