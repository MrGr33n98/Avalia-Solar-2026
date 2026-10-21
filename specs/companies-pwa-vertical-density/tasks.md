# Tasks: PWA / Mobile Vertical Density Optimization on `/companies`

- [x] **Task 1: Inventory & Read-Only Audit** <!-- id: 0 -->
  - [x] Inspect all 8 relevant components: `CompaniesPageClient.tsx`, `ActiveFiltersSummary.tsx`, `MobileCompanyFilterBar.tsx`, `BannerByLocation.tsx`, `CompanyCard.tsx`, `Navbar.tsx`, `MobileBottomNav.tsx`, `globals.css`.
  - [x] Map the exact CSS classes and computed heights causing vertical sprawl.
  - [x] Verify baseline tests and TypeScript typecheck.

- [x] **Task 2: Implement Component Spacing Adjustments** <!-- id: 1 -->
  - [x] 2.1 Update `ActiveFiltersSummary.tsx`: compact mobile padding and chip row spacing (`px-3 py-2 space-y-1.5 md:space-y-3 md:px-5 md:py-4`).
  - [x] 2.2 Update `MobileCompanyFilterBar.tsx`: compact horizontal container padding (`px-3 py-1.5`).
  - [x] 2.3 Update `CompaniesPageClient.tsx`:
    - Outer container padding: `px-3 py-3 sm:px-6 md:py-6 lg:px-8`.
    - Replace `space-y-6` with `flex flex-col gap-3 md:gap-6`.
    - Add `empty:hidden` to `BannerByLocation` wrapper.
    - Heading to toolbar controls gap: `gap-2 sm:gap-4`.
    - Adjust result counter negative margin: `-mt-1 md:-mt-2`.
    - Cards grid gap: `gap-3 sm:gap-4`.

- [x] **Task 3: Validation & Quality Gates** <!-- id: 2 -->
  - [x] Run `npm run typecheck` in `AB0-1-front`.
  - [x] Run `npm test` in `AB0-1-front` for related tests.
  - [x] Calculate cumulative pixel reduction against contract G01-G10.
  - [x] Verify desktop integrity (`md:` breakpoints unchanged).
