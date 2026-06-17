# Codebase Structure

**Analysis Date:** 2025-02-13

## Directory Layout

```
AB0-1-mobile/
├── android/            # Native Android project files
├── assets/             # Images, fonts, and static assets
├── scripts/            # Utility scripts (reset project, etc.)
└── src/
    ├── app/            # Expo Router routes (Screens)
    │   ├── chat/       # Mock-based chat screens
    │   ├── company/    # Company profile and lead forms
    │   ├── p2p_chat/   # ActionCable-based real chat
    │   └── ...         # Root screens (index, explore, profile)
    ├── components/     # Shared React components
    │   ├── search/     # Search-specific components
    │   └── ui/         # Base UI primitives (buttons, inputs)
    ├── constants/      # Theme and global constants
    ├── hooks/          # Shared React hooks
    ├── lib/            # Infrastructure and service layer
    ├── store/          # Global state management (Zustand)
    └── types/          # Global type definitions (if any)
```

## Directory Purposes

**src/app:**
- Purpose: Defines the application's navigation structure and screens.
- Contains: `.tsx` files mapping to routes.
- Key files: `src/app/_layout.tsx` (Root), `src/app/index.tsx` (Home).

**src/components:**
- Purpose: Reusable UI blocks.
- Contains: Functional components, sometimes with platform-specific versions (`.web.tsx`).
- Key files: `src/components/themed-text.tsx`.

**src/lib:**
- Purpose: External service integrations and utilities.
- Contains: API clients, authentication storage logic.
- Key files: `src/lib/api.ts`, `src/lib/apolloClient.ts`.

**src/store:**
- Purpose: Global client-side state.
- Contains: Zustand stores.
- Key files: `src/store/auth.ts`.

## Key File Locations

**Entry Points:**
- `src/app/_layout.tsx`: Main application wrapper and providers.
- `src/app/index.tsx`: Main dashboard / Home screen.

**Configuration:**
- `app.json`: Expo manifest.
- `src/lib/api.ts`: API Base URL and version configuration.

**Core Logic:**
- `src/lib/api.ts`: Centralized API service methods.
- `src/store/auth.ts`: Authentication state logic.

**Testing:**
- Not detected in standard locations; likely relies on manual testing or linting.

## Naming Conventions

**Files:**
- Routes: kebab-case (e.g., `p2p_chat`, `local_solar_pages`).
- Components: kebab-case or PascalCase (e.g., `themed-text.tsx`, `MobileSearchMap.tsx`).

**Directories:**
- Feature/Module: kebab-case or snake_case in `app/`.

## Where to Add New Code

**New Feature Screen:**
- Implementation: `src/app/[feature-name].tsx` or `src/app/[feature-name]/index.tsx`.

**New Component:**
- UI Primitives: `src/components/ui/`
- Feature-specific components: `src/components/[feature]/`

**New API Service:**
- Implementation: Add to `src/lib/api.ts` or create a new file in `src/lib/` if it's large.

**Utilities:**
- Shared helpers: `src/utils/` (if it exists) or `src/lib/`.

## Special Directories

**.expo:**
- Purpose: Expo-managed temporary files and types.
- Generated: Yes.
- Committed: No (typically).

---

*Structure analysis: 2025-02-13*
