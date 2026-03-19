# Brand Analytics — WEG

## Brand Config

- brand_slug: weg
- brand_id: 42
- aliases: w.e.g, weg motors, weg-industria
- status: active

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
