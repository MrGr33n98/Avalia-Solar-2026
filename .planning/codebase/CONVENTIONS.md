# Coding Conventions

## Style / Syntax
- Uses **TypeScript** tightly coupled with **Zod** schema validations (`@hookform/resolvers`).
- Favors strict linting (`eslint-config-next`), applying `lint-staged` with `prettier --write` for automatic styling inside Git Hooks (`husky`).
- Relies heavily on **Tailwind CSS Utility Classes** mixed (`cn()`, `clsx`, `tailwind-merge`).

## Layout Patterns
- Extensively uses dynamically imported React components (`next/dynamic` with skeleton loaders for fallback `loading: () => <Skeleton/>`) to improve initial bundle loading logic on heavy overview pages (`CompanyDetailClient.tsx`).
- Responsive `<Card>` elements encapsulated in standard structural div layers.
