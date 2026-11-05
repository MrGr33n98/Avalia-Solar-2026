# Avalia Solar — Star Rating Widgets: G2-inspired compact specification
**Status:** Implementation branch; validation required before production.
**Reference:** user-supplied screenshot of three G2 review badges. Proportions are visually estimated from the image, not asserted to be G2's official asset specification.

## Sizes and variants
| ID | Final external embed | Layout | Palette |
|---|---|---|---|
| `blue` | **120 × 54 px** | 21px rating header, compact footer with logo | Avalia electric blue `#0B5FFF` and `#143DB7` |
| `navy` | **120 × 54 px** | 21px rating header, compact footer with logo | Dark `#0A1F44` and `#09152C` |
| `light` | **120 × 54 px** | rating left, vertical brand band right | White + Avalia blue |

All three badges include the **company's circular profile avatar (22 × 22 px)**, approved rating and visible Avalia Solar attribution. The Summary widget includes the same real avatar at **36 × 36 px**. When the logo is absent or not a trusted HTTPS resource, the preview and export fall back to company initials — never to a fake logo.

Unlike the G2 image, these are *Avalia Solar* assets and not reproductions of G2 branding or licensed graphics. The exact dimension is fixed via inline styles on the exported static HTML and via matching dimensions in the React preview.

## Customer experience
1. Open `/dashboard?company_id={id}&tab=marketing-widgets`.
2. Under **Widget de Estrelas**, the catalog shows three stacked compact examples.
3. Click **Personalizar agora** to reveal buttons **Azul / Azul-marinho / Claro**.
4. Each button updates the selected badge preview and generated HTML; the only published score and company branding come from the selected company's real record.
5. Click **Copiar HTML estático** when `approved_reviews > 0` and `average_rating` is valid. Paste into a site or email system supporting HTML.

## Source of truth and security
- Real company `name`, `slug`, `logo_url` / `identity.logo_url` from the authenticated company dashboard.
- Rating and count from `company_dashboard/social_proof_stats`.
- The generated HTML is a **snapshot**, *not* a live updater. The external website must replace it when the company rating changes.
- Only company-owned logo URLs on trusted HTTPS `*.avaliasolar.com.br` or `*.digitaloceanspaces.com` hosts are emitted in the embed; unsafe URL schemes and untrusted hosts are omitted.
- Escape company name and other content; never inject untrusted styles or JS.
- Do not include a misleading progress bar or numeric rating if no approved reviews exist.
- Keep gates and official rankings unchanged. Star widgets do not grant badges.

## Mobile QA
- At 320, 360, 390, 430px: catalog stacks cards; badge remains 120 × 54 (not stretched). Controls must be at least 44px high.
- At 768/1024/1440px: four catalog cards remain aligned, with vertically stacked badges.
- Switching tenant does not show the old company's avatar or rating; verify both UI and clipboard.
- Broken image falls back to initials; screen reader receives company name and rating labels.
- Verify CSS parity between exported static HTML and preview across common browsers.
- Test default, alternate variants, missing data, missing logo, invalid logo host, clipboard failure and escaping.

## Commands
```sh
cd AB0-1-front
npm test -- --runInBand lib/marketing-widgets/snapshot.spec.ts app/dashboard/components/marketing-widgets/ReputationMarketingWidgets.spec.tsx
npm run typecheck
npm run build
```

**Release criteria:** passing CI, manual browser QA and product approval. No deployment is implied by adding these assets to the branch.
