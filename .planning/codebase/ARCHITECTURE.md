# Architecture

## Design Guidelines (AS-EDS)
Aesthetics govern the framework entirely: "Avalia Solar Enterprise Design System" (AS-EDS).
- **Claymorphism:** Employs Convex (`.clay-convex`), Concave (`.clay-concave`) tokens for deep, extruded material feel. 
- **Glassmorphism & Precision Clay:** Background UI with transparency using `bg-blue-50/10 backdrop-blur` etc.
- **Trust as a Service (TaaS):** Platform built for generating high-intent leads using Trust Scores.

## Data Fetching
- Employs Next.js Server Components initially, wrapping rich interactive components within `"use client"`.
- Features isolated backend fetch utilities (`productsApiSafe`, `reviewsApiSafe`, `analyticsApi`).

## Analytical Observability
- Relies heavily on intent capturing (`useScrollPause`, `BreadcrumbJsonLd`).
