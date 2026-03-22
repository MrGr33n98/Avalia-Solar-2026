# Concerns / Debt

## Active Maintenance
- Missing or inconsistent Types generic mappings on nested data elements (`(rev as any)?.rating` etc) forcing bypass of TypeScript protections.
- Potential performance degradation with overly heavy components (`app/companies/[id]/CompanyDetailClient.tsx`). The use of multiple Next.js Dynamic components with arbitrary Skeletons helps mitigate initially, but could be cleaner if server rendered completely logic.
- Complex nested styles inside `className` attributes might be confusing without stricter abstractions in generic reusable `.tsx` components in UI.
- Ensure external APIs return expected typings to prevent blank runtime collapses (`const typeLower = type.toLowerCase()`).

## External Assets
- Managing dynamic UI state related to `Image` paths returning HTTP `404` errors silently without safe fallbacks (although some have `zap` generic placeholders to mitigate this issue natively).
