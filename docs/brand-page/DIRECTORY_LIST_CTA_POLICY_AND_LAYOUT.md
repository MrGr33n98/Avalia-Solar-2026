# Directory list — organic conversion CTAs (November 2026)

## Approved design / UI-CTA-DIR-01
Surface: `/companies?view=list` in `CompaniesPageClient` / `CompanyDirectoryRow`.

Hierarchy:
- Company identity, reputation and location;
- right-hand action shelf: **Favorite** (existing auth gate), **WhatsApp** (optional, circular green with company avatar / official glyph), **Solicitar orçamento** (optional, blue), **Comparar** (existing checkbox).
- Mobile: actions move to a second compact row; all hit targets remain at least 44×44px. Under 400px the quote label shortens to **Orçamento**; accessible label remains **Solicitar orçamento**.
- No fake star ratings, fictional testimonials, fake contact URLs or artificial entitlements.

## Canonical policy — MUST NOT fork
`resolveCompanyConversionCTAs(rawCompany)` delegates to `canUsePaidConversion` and `getCompanyWhatsAppHref`, which enforce:
1. explicit `has_paid_plan === true` (missing/Free/expired fails closed);
2. independent backend entitlements: `custom_ctas` for quote, `whatsapp_contact_button` for WhatsApp;
3. saved quote preference `quote_cta_enabled !== false`;
4. configured WhatsApp flag and a valid company WhatsApp URL;
5. no inferred WhatsApp from ordinary `phone` and no forced visitor login.
The final decision is made from the **raw `fields=card` DTO**, not from a lossy normalization used for visual card data. The existing serializer already exports the fields.

If neither conversion is available, render neither CTA: the whole company row still navigates to its profile; Favorite and Compare remain available with their previous policies.

## Tracking and flow
- Quote retains the existing `openLeadModal({ preferredCompanyId, source: 'company_card', type: 'quick' })` flow.
- `trackCTAClick` emits `company_cta_clicked` with `cta_type`, `company_id` and `cta_location: 'other'`; the URL identifies directory placement. No unregistered surface IDs are sent.
- WhatsApp is a real outbound `<a>` link with `target="_blank"` and `rel="noopener noreferrer"`.
- Favorites continue using authenticated API; comparison continues using its shared store / selection limit.

## TDD and validation
- Unit tests: subscription/entitlement matrix, WhatsApp URL normalization, click handlers and metadata.
- List integration: action order and Free behavior.
- Existing TypeScript and security/CI gates must pass before merge.
- Browser/device QA target sizes: 320, 360, 390, 430, 768, 1024, 1440px. No forced overflow or secondary app navigation.
- This is direct organic contact, not lead sales, lead distribution, a volume guarantee, or per-lead billing.
