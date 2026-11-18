# Avalia Solar — Brand Page / FAQ Compact Chips V2

## Scope

Mobile/PWA-only visual compacting for company navigation and Brand Page FAQ category filters, following the approved Meta-inspired V2 reference. This change does not modify plan entitlements, API endpoints, backend schema, quotes/WhatsApp CTAs or the desktop navigation.

## Geometry contract

| Surface | Visible height | Interactive target | Shape | Typography |
| --- | ---: | ---: | --- | --- |
| Company tab | 36px | 44px | pill / radius 9999px | 12px / 16px |
| FAQ filter | 32px | 44px | pill / radius 9999px | 12px / 16px |

- Horizontal chip gap: 4px; no label wrapping or truncation.
- Selected: solid `blue-600` with white text; inactive: `slate-100` with subtle `slate-200` border.
- Scroll is local to the navigation/filter rails, not the document.
- Available tabs and FAQ categories remain accessible; the current selection is highlighted.
- The full accessible label remains `Produtos e Serviços`, although the visible mobile label is `Produtos`.
- The existing products categories sheet and its analytics events remain intact.
- FAQ header/content use 16px padding, with tighter local gaps; question/answer body remains readable.
- Underlying shared `Button` and `Card` primitives remain unchanged.

## Files

- `AB0-1-front/app/companies/[id]/components/CompanyCompactChip.tsx` — scoped compact control
- `AB0-1-front/app/companies/[id]/components/CompanyProfileTabs.tsx` — one-line company tabs
- `AB0-1-front/app/companies/[id]/components/FaqSection.tsx` — filter rail and spacing
- `AB0-1-front/app/companies/[id]/components/CompanyProfileTabs.spec.tsx` — unit tests
- `AB0-1-front/app/companies/[id]/components/FaqSection.spec.tsx` — FAQ filter tests
- `AB0-1-front/tests/e2e/brand-page-mobile-tabs-geometry.spec.ts` — browser geometry tests

## Acceptance gates

1. At 320, 360, 375, 390, 414, 480, 640 and 767 CSS pixels, none of the labels wraps or clips.
2. The document has no horizontal overflow; each local rail can scroll to all options.
3. Visual chip height equals 36px (tabs) or 32px (FAQ); interactive height equals 44px.
4. Projects/FAQ/Financing remain gated by current feature policy.
5. All available categories remain available after a FAQ category selection or text search.
6. Products category sheet, tab selection callback, FAQ search, accordion, voting and view tracking remain functional.
7. Browser screenshots are compared against the V2 reference before approval.

## Verification commands

From `AB0-1-front`:

```bash
npm run typecheck
npm test -- --runInBand 'app/companies/\\[id\\]/components/CompanyProfileTabs.spec.tsx' 'app/companies/\\[id\\]/components/FaqSection.spec.tsx'
npx playwright test tests/e2e/brand-page-mobile-tabs-geometry.spec.ts --project=chromium
```

## Rollout / rollback

- Ship via an isolated PR to `main` after CI and real browser checks.
- Do not deploy automatically as part of this task.
- Rollback by reverting the PR commit(s) if the UI displays overflow, missing tabs or inaccessible controls.
- Any changes to the shared Button primitive require a separate review and are out of scope.

**Verification status:** changes authored via GitHub integration; local npm/Jest/Playwright execution unavailable in this environment. CI and real browser screenshot evidence remain required before merge.
