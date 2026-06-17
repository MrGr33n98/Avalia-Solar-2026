# Technology Stack

**Analysis Date:** 2025-02-13

## Languages

**Primary:**
- TypeScript ~6.0.3 - Used throughout the entire project for type safety.

**Secondary:**
- JavaScript - Used in configuration files and some scripts (e.g., `scripts/reset-project.js`).

## Runtime

**Environment:**
- Expo ~56.0.11 (Note: Versions in package.json seem unusually high, possibly a future-dated project or custom registry).
- React Native 0.85.3.

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- React 19.2.3 - Frontend library.
- Expo Router ~56.2.10 - File-based routing system.

**Testing:**
- Not explicitly configured in `package.json` scripts, but `expo lint` is present.

**Build/Dev:**
- Expo CLI - For starting, building, and running the app.

## Key Dependencies

**Critical:**
- `@tanstack/react-query` ^5.101.0 - For server state management and data fetching.
- `zustand` ^5.0.14 - For global client state management (e.g., Auth).
- `@apollo/client` ^4.2.3 - For GraphQL integrations.
- `expo-router` ~56.2.10 - Navigation framework.

**Infrastructure:**
- `@rails/actioncable` ^8.1.300 - For real-time WebSocket communication (Chat).
- `posthog-react-native` ^4.47.2 - For analytics and event tracking.
- `expo-secure-store` ^56.0.4 - For secure storage of sensitive data (Auth tokens).

## Configuration

**Environment:**
- Configured via `.env` and `EXPO_PUBLIC_` variables.
- Key configs: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_GRAPHQL_HOME_ENABLED`.

**Build:**
- `app.json`: Expo configuration.
- `tsconfig.json`: TypeScript configuration.

## Platform Requirements

**Development:**
- Node.js, Expo CLI, Android Studio / Xcode for native builds.

**Production:**
- Android and iOS via Expo EAS or local native builds.

---

*Stack analysis: 2025-02-13*
