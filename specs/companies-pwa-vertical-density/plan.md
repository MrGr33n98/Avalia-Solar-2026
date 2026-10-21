# Plan: PWA / Mobile Vertical Density Optimization on `/companies`

## Architecture Analysis
The primary surface is `CompaniesPageClient.tsx` and child components `ActiveFiltersSummary.tsx` and `MobileCompanyFilterBar.tsx`.
Currently, the parent container applies `space-y-6` unconditionally. When children like `BannerByLocation` return `null`, its wrapping container div still renders in the DOM without `empty:hidden`, causing `space-y-6` to apply a full 24px top margin to the subsequent child. Furthermore, `ActiveFiltersSummary` has large padding (`py-3`) which cascades into the parent's `space-y-6`.

## Proposed Incremental Modifications

### Step 1: `CompaniesPageClient.tsx`
1. **Container Padding:**
   - Change: `px-4 py-6 sm:px-6 lg:px-8` -> `px-3 py-3 sm:px-6 md:py-6 lg:px-8`.
2. **Main Content Stack:**
   - Change: `w-full min-w-0 flex-1 space-y-6` -> `flex w-full min-w-0 flex-1 flex-col gap-3 md:gap-6`.
   - Rationale: Switching from `space-y-6` to flex column with `gap-3 md:gap-6` ensures:
     - Spacing between mobile sections drops from 24px to 12px.
     - On desktop, `md:gap-6` maintains the 24px spacing.
     - When elements are hidden (via `display: none` / `empty:hidden`), CSS Flexbox ignores them for gap calculation, unlike `space-y-*` which applies margin to all siblings.
3. **Banner Container:**
   - Change: `<div className="w-full min-w-0 max-w-full">` -> `<div className="w-full min-w-0 max-w-full empty:hidden">`.
   - When `BannerByLocation` returns `null`, the wrapper becomes `:empty` and is hidden (`display: none`), thus contributing 0px to layout and 0px to flex gap!
4. **Heading & Toolbar Controls:**
   - Change: `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` -> `flex flex-col gap-2 sm:flex-row sm:gap-4 sm:items-center sm:justify-between`.
   - On mobile, distance between Title/Subtitle and sorting controls drops from 16px to 8px.
5. **Results Counter:**
   - Change: `<p className="text-xs text-slate-400 font-medium -mt-2">` -> `<p className="text-xs text-slate-400 font-medium -mt-1 md:-mt-2">`.
   - Fits smoothly within the 12px flex gap.
6. **Cards Grid:**
   - Change: `grid w-full min-w-0 gap-4` -> `grid w-full min-w-0 gap-3 sm:gap-4`.
   - Card-to-card gap on mobile drops from 16px to 12px, saving space as the user scrolls.

### Step 2: `ActiveFiltersSummary.tsx`
1. **Container Padding & Spacing:**
   - Change: `space-y-2 px-4 py-3 md:space-y-3 md:px-5 md:py-4 border-b border-slate-200` -> `space-y-1.5 px-3 py-2 md:space-y-3 md:px-5 md:py-4 border-b border-slate-200`.
   - On mobile, vertical padding decreases from 24px total to 16px total, and spacing between label and chips from 8px to 6px.
   - Preserves desktop spacing via `md:` tokens.

### Step 3: `MobileCompanyFilterBar.tsx`
1. **Container Padding:**
   - Change: `px-4 py-2` -> `px-3 py-1.5`.
   - Reduces container height slightly while maintaining the 48px touch-target standard on button elements.

### Step 4: Verification & Automated Quality Gates
1. Run Jest tests (`npm test`).
2. Run TypeScript typecheck (`npm run typecheck`).
3. Verify visual regression and measurements.
