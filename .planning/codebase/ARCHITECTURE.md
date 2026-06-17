# Architecture

**Analysis Date:** 2025-02-13

## Pattern Overview

**Overall:** Feature-based routing with a centralized service layer.

**Key Characteristics:**
- **File-based Routing:** Uses Expo Router for navigation based on the `src/app` directory.
- **Service Layer Abstraction:** API calls are centralized in `src/lib/api.ts`.
- **Dual Data Fetching:** Supports both REST (via `fetch`) and GraphQL (via Apollo).

## Layers

**UI Layer:**
- Purpose: Presentation and user interaction.
- Location: `src/app` (screens) and `src/components` (reusable units).
- Contains: React Native components, hooks for local state.
- Depends on: `src/hooks`, `src/store`, `src/lib/api.ts`.

**Service Layer:**
- Purpose: Communication with external APIs and storage.
- Location: `src/lib`
- Contains: `api.ts` (REST/GraphQL clients), `authStorage.ts` (secure persistence).
- Depends on: `expo-secure-store`, `@apollo/client`.

**State Management Layer:**
- Purpose: Global application state.
- Location: `src/store`
- Contains: `auth.ts` (Zustand store for user session).
- Depends on: `src/lib/authStorage.ts`.

## Data Flow

**Standard API Request:**

1. Screen (e.g., `src/app/index.tsx`) calls a hook or a service method.
2. `src/lib/api.ts` executes a `fetchApi` (REST) or Apollo query.
3. Response is typed and returned to the caller.
4. Server state is often cached using React Query in the UI layer.

**Authentication Flow:**
- Login via `authApi.login` -> Token stored in `SecureStore` via `authStorage.ts` -> User state updated in `useAuthStore` (Zustand).

## Key Abstractions

**API Modules:**
- Purpose: Grouped endpoints by domain.
- Examples: `companiesApi`, `categoriesApi`, `leadsApi` in `src/lib/api.ts`.
- Pattern: Object literal with async methods.

**Themed Components:**
- Purpose: Abstract styling for dark/light mode support.
- Examples: `src/components/themed-text.tsx`, `src/components/themed-view.tsx`.

## Entry Points

**Expo Router Entry:**
- Location: `src/app/_layout.tsx`
- Triggers: App launch.
- Responsibilities: Setting up providers (React Query, Apollo, Auth), handling global styles, and defining the root navigation stack.

## Error Handling

**Strategy:** Centralized try/catch in service layer with typed error objects.

**Patterns:**
- `fetchApi` throws a structured object with `status`, `message`, and `details`.
- UI handles errors via React Query's `error` state or local try/catch blocks.

## Cross-Cutting Concerns

**Logging:** Request/Response logging implemented in `src/lib/api.ts`.
**Validation:** Typescript interfaces define the shape of API responses.
**Authentication:** JWT-based, handled automatically by `fetchApi` by injecting headers from `SecureStore`.

---

*Architecture analysis: 2025-02-13*
