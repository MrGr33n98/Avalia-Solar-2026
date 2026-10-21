# Implementation Plan: PWA Side Filter Drawer (Max Width 70%)

## Architecture & Component Breakdown

### Step 1: Communication Surface Manager Update
- In `lib/communication-surface-manager.ts`:
  - Add `'filters_drawer'` to `CommunicationSurface` union type (`'none' | 'mobivolt' | 'p2p' | 'comparison' | 'embedded_chat' | 'filters_drawer'`).
- In `components/chat/ChatWidget.tsx`:
  - Ensure the floating launcher button respects `isBlocked` so it completely disappears when the filter drawer is open.

### Step 2: Refactor `MobileCompanyFiltersSheet.tsx` to Right Side Drawer
- Maintain all existing state, handlers, props (`open`, `onClose`, `filters`, `onApply`, `initialGpsError`), effects, analytics, and debounced counting logic.
- Change container structure:
  - Outer backdrop overlay: `fixed inset-0 z-[9500] bg-black/40 backdrop-blur-xs transition-opacity duration-240`.
  - Drawer container:
    - Fixed to right edge: `fixed top-0 right-0 bottom-0 h-full max-h-[100dvh] w-[70vw] max-w-[70vw] bg-white rounded-l-[20px] shadow-2xl flex flex-col z-[9501] overflow-hidden`.
    - Animation: `transition-transform duration-240 ease-out` sliding in from `translate-x-full` to `translate-x-0`.
  - Header:
    - Fixed at top: `flex items-center justify-between px-3.5 sm:px-4 py-3 border-b border-slate-100 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]`.
    - Title: "Filtrar empresas" + accessible Close (X) button.
  - Body / Scrollable Content:
    - `flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-4 py-4 space-y-4 [-webkit-overflow-scrolling:touch]`.
    - Adapt internal filter elements so that no inputs or grid items overflow the 70vw container (e.g. 224px wide on 320px viewport):
      - GPS button: flexible text with `truncate` or wrap.
      - GPS Radius buttons: `grid-cols-3` or `grid-cols-5` with compact padding.
      - Estado and Cidade selects: stack vertically (`flex flex-col gap-2.5` or `grid grid-cols-1 sm:grid-cols-2`) to avoid cramped selects on 224px.
      - Category picker button: wraps text gracefully.
      - Verified checkbox: full width label with wrap.
      - Rating buttons: responsive grid (`grid-cols-2 sm:grid-cols-5` or flex-wrap).
      - Atendimento e Recursos: stack on ultra-narrow viewports (`grid grid-cols-1 sm:grid-cols-2 gap-2`).
  - Category Picker Sub-View:
    - Rendered as an internal drawer overlay (`absolute inset-0 z-30 flex flex-col bg-white rounded-l-[20px] overflow-hidden`) so it stays strictly within the 70vw boundary.
  - Footer:
    - Fixed at bottom: `shrink-0 border-t border-slate-100 bg-white px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
    - "Limpar filtros" button + "Ver X empresas / Aplicar filtros" button.
  - Lifecycle:
    - Lock body scroll when open (`document.body.style.overflow = 'hidden'`).
    - Integrate with `CommunicationSurfaceManager.open('filters_drawer')` and `.close('filters_drawer')`.

### Step 3: Integrate with `HomeLocationBar.tsx`
- Replace direct `<Link href="...">` with interactive button that opens `MobileCompanyFiltersSheet`.
- Load `MobileCompanyFiltersSheet` dynamically via `next/dynamic`.
- When opened on Landing Page:
  - Uses current location state as initial filter (`state: selectedState ? [selectedState] : []`).
  - When closed: restores state, stays on Landing Page.
  - When applied: calls `router.push(buildTargetUrl(nextFilters))` to navigate with all chosen filters.

### Step 4: Verification and Quality Assurance
- Automated tests: run Jest tests (`npm test`).
- TypeScript typecheck: `npm run typecheck`.
- ESLint: run on all modified files.
- Visual viewport calculations: assert `width <= window.innerWidth * 0.70` across 320px, 375px, 390px, 430px, 480px.
