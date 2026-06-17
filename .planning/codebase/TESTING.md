# Codebase Concerns

**Analysis Date:** 2025-02-13

## Tech Debt

**Dual Chat Implementation:**
- Issue: There are two chat implementations: `/chat` (mock-based) and `/p2p_chat` (ActionCable/Real). This causes confusion and violates the PRD.
- Files: `src/app/chat/index.tsx`, `src/app/p2p_chat/index.tsx`.
- Impact: Users might land on the mock version, and maintenance is duplicated.
- Fix approach: Delete the mock-based `/chat` and rename `p2p_chat` to `chat` or update all links to point to `p2p_chat`.

**Hardcoded Mocks in Home:**
- Issue: `HomeScreen` uses hardcoded arrays for companies, categories, and price estimates.
- Files: `src/app/index.tsx`.
- Impact: Violates the "No Mocks in Production" principle of the PRD.
- Fix approach: Ensure React Query properly fetches all data and provide empty states instead of mock fallbacks.

**Hardcoded Localization Defaults:**
- Issue: `selectedState` is defaulted to 'MT' (Mato Grosso) and `selectedCity` to 'Cuiabá' in the Home screen.
- Files: `src/app/index.tsx`.
- Impact: Not personalized for users in other regions.
- Fix approach: Use `expo-location` (already in dependencies) to detect user location or fetch default from backend.

## Fragile Areas

**GraphQL vs REST Inconsistency:**
- Files: `src/lib/api.ts`.
- Why fragile: Some endpoints use Apollo Client, while others use Fetch API. This split makes it harder to implement universal features like request interceptors or global error handling.
- Safe modification: Standardize on one (preferably REST as requested by PRD for "most things") or ensure both layers share the same auth/error logic.

**Styling Inconsistency:**
- Files: `src/components/`, `src/app/`.
- Why fragile: Mixture of `ThemedView/Text`, standard `StyleSheet`, and CSS Modules (`.module.css`).
- Safe modification: Consolidate styling approach to follow the Design System tokens in `src/constants/theme.ts`.

## Scaling Limits

**ActionCable Connectivity:**
- Current capacity: Dependent on backend server.
- Limit: ActionCable can be resource-intensive on the server side with many concurrent mobile users.
- Scaling path: Consider `AnyCable` or high-performance WebSocket alternatives if traffic grows.

## Missing Critical Features

**Review via QR Code Integration:**
- Problem: The PRD emphasizes Review via QR Code, but the current codebase only has a `scanner.tsx` which seems oriented towards utility bills (calculadora).
- Blocks: Core requirement for company reputation management.
- Files: `src/app/scanner.tsx`.

**Product Marketplace:**
- Problem: The Home screen and `api.ts` focus heavily on Companies, but the PRD requires a robust Product marketplace.
- Files: `src/app/inversores.tsx`, `src/app/baterias.tsx` (appear to be separate static routes instead of a dynamic category/product flow).

## Test Coverage Gaps

**Automated Testing:**
- What's not tested: No unit, integration, or E2E tests detected.
- Files: Entire `src/` directory.
- Risk: Regressions in the API layer or Auth flow could break the app silently.
- Priority: High.

---

*Concerns audit: 2025-02-13*
