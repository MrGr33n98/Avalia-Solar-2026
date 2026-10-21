# Tasks: PWA Side Filter Drawer (Max Width 70%)

- [x] **Task 1: Inventory & Infrastructure** <!-- id: 0 -->
  - [x] Verify existing files, types, and hooks (`MobileCompanyFiltersSheet.tsx`, `HomeLocationBar.tsx`, `CompanyCategoryPicker.tsx`, `ChatWidget.tsx`, `communication-surface-manager.ts`).
  - [x] 1.1 Add `'filters_drawer'` to `CommunicationSurface` union in `lib/communication-surface-manager.ts`.
  - [x] 1.2 Update `ChatWidget.tsx` launcher button to hide when `isBlocked` is true.

- [x] **Task 2: Refactor `MobileCompanyFiltersSheet.tsx` to Right Side Drawer** <!-- id: 1 -->
  - [x] 2.1 Update container layout: right-aligned fixed position (`fixed top-0 right-0 bottom-0`), width `w-[70vw] max-w-[70vw]`, height `100dvh`, rounded left corners `rounded-l-[20px]`, lateral shadow.
  - [x] 2.2 Add slide-in animation from right (`translate-x-full` to `translate-x-0`, 240ms ease-out).
  - [x] 2.3 Style backdrop overlay (`rgba(0,0,0,0.40)`) with click-to-close behavior leaving >= 30% visible.
  - [x] 2.4 Fix header and footer with safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  - [x] 2.5 Ensure internal responsiveness on ultra-compact widths (320px viewport = 224px drawer): stack Estado/Cidade vertically if needed, ensure labels and buttons do not overflow.
  - [x] 2.6 Render `CompanyCategoryPicker` sub-view within drawer bounds (internal sub-panel) maintaining 70vw limit.
  - [x] 2.7 Connect `CommunicationSurfaceManager` open/close lifecycle and lock body scroll.

- [x] **Task 3: Implement Landing Page Filter Drawer in `HomeLocationBar.tsx`** <!-- id: 2 -->
  - [x] 3.1 Replace direct `<Link>` navigation with open state for `MobileCompanyFiltersSheet`.
  - [x] 3.2 Dynamic import of `MobileCompanyFiltersSheet`.
  - [x] 3.3 On apply, navigate to `/companies?...` using existing query params serialization.
  - [x] 3.4 On close/cancel, stay on Landing Page and preserve scroll position.

- [x] **Task 4: Quality Gates & Verification** <!-- id: 3 -->
  - [x] 4.1 Run TypeScript typecheck (`npm run typecheck`).
  - [x] 4.2 Run unit and integration tests (`npm test`).
  - [x] 4.3 Run ESLint on changed files.
  - [x] 4.4 Verify width assertions across all viewports (`w <= innerWidth * 0.70`).
