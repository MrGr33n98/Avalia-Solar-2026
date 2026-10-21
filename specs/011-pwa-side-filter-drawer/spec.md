# SPEC: PWA Side Filter Drawer (Max Width 70%)

## Metadata
- **Feature:** PWA Side Filter Drawer — Max Width 70%
- **Status:** Approved / In Progress
- **Priority:** P1 — Mobile/PWA User Experience
- **Surface:** Marketplace público (`/companies` and Landing Page `HomeLocationBar`)
- **Direction:** Right to Left (Slide-in)
- **Max Width:** Strict 70% viewport width (`w-[70vw] max-w-[70vw]`)
- **Backdrop:** Minimum 30% viewport visible with `rgba(0,0,0,0.40)` overlay

---

## 1. Objectives & Behavioral Requirements

1. **Side Drawer Architecture:**
   - Transform `MobileCompanyFiltersSheet.tsx` from bottom sheet (`flex items-end justify-center`) into a right-aligned sliding side drawer.
   - Slide horizontally from right to left (`translate-x-full` to `translate-x-0`).
   - Strict maximum width: `w-[70vw] max-w-[70vw]` across all viewports (e.g. 224px on 320px, 273px on 390px, 301px on 430px).
   - Backdrop covers full viewport with `rgba(0,0,0,0.40)` background, leaving >= 30% of original screen context visible to the left.
   - Fixed header with title and close button (X).
   - Fixed footer with "Limpar filtros" and "Ver X empresas / Aplicar filtros".
   - Scrollable middle content: `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
   - Left corners rounded: `rounded-l-[20px]`.
   - Subtle premium lateral shadow: `-10px 0 25px -5px rgba(0, 0, 0, 0.1), -8px 0 10px -6px rgba(0, 0, 0, 0.1)`.
   - Smooth 240ms ease-out animation.

2. **Landing Page Integration (`HomeLocationBar.tsx`):**
   - In `HomeLocationBar.tsx`, clicking "Filtros" must NOT perform immediate URL navigation.
   - Instead, it opens the side drawer directly on the Landing Page.
   - The user remains on the Landing Page, scroll position is preserved, and backdrop dims the page.
   - Closing the drawer discards unapplied changes without navigating.
   - Applying filters executes router navigation to `/companies?...` with the selected parameters.

3. **Companies Page Integration (`CompaniesPageClient.tsx`):**
   - Clicking "Filtros" opens the same side drawer from the right.
   - Background list remains visible (at least 30%) and does not lose scroll position.
   - Page scroll is locked (`overflow: hidden` on body) while drawer is open.
   - Applying or canceling preserves existing business logic.

4. **Category Selection (`CompanyCategoryPicker.tsx`):**
   - Sub-picker for categories opens within the drawer boundaries (not as a 100vw bottom sheet over the drawer).
   - Strict 70vw boundary is maintained.

5. **Chatbot / Floating Elements (`ChatWidget.tsx`):**
   - Floating IA widget must not overlay drawer, header, footer, or inputs.
   - Registered with `CommunicationSurfaceManager` as `'filters_drawer'`, properly blocking and hiding floating launcher while drawer is open.

6. **Preservation Invariant (Zero Business Logic Loss):**
   - ALL existing filter fields, options, states, cities, GPS geolocation, radius selector, category trees, checkboxes, rating buttons, debounced count queries, error handlers, and analytics events are preserved 100%.
