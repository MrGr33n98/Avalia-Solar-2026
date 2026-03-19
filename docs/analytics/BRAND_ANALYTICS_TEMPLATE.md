# Brand Analytics Template

Use este template para configurar analytics de qualquer brand/parceiro.

## Brand Config

- brand_slug:
- brand_id:
- aliases:
- status:

## Event Requirements (brand-aware)

Eventos que devem sempre incluir `brand_id`, `brand_slug`, `app_key`:

- product_view
- product_impression
- product_click
- product_cta_click
- product_company_click
- product_share

## Core Metrics

1. Views (30d): count(product_view)
2. Clicks (30d): count(product_click)
3. CTA Clicks (30d): count(product_cta_click)
4. Conversion Rate: cta_clicks / views

## Funnel Default

`product_view -> product_click -> product_cta_click`

## Data Sources

- analytics_events (primary)
- PostHog (secondary / validation)

## Quality Gates

- % eventos de produto com brand_id >= 95%
- contract violations por dia = 0

## Notes

- Parametros via API:
  - `GET /api/v1/analytics/overview?dimension=brand&value={brand_slug}&days=30`
  - `GET /api/v1/analytics/funnel?dimension=brand&value={brand_slug}&steps=...`
