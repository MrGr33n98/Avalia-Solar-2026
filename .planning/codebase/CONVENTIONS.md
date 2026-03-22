# Coding Conventions

## Frontend (AB0-1-front)
- Uses **TypeScript** tightly coupled with **Zod** schema validations (`@hookform/resolvers`).
- Favors strict linting (`eslint-config-next`), applying `lint-staged` with `prettier --write` for automatic styling inside Git Hooks (`husky`).
- Relies heavily on **Tailwind CSS Utility Classes** mixed (`cn()`, `clsx`, `tailwind-merge`) and Claymorphism classes (`.clay-card`, `.clay-precision`).
- Extensive Use of `next/dynamic` to lazy load sections in Dashboard and Company Overviews (`CompanyDetailClient.tsx`).

## Backend (AB0-1-back)
- **Ruby / Rails Way:** Strongly typed architectures following default Rails application patterns (Models, Views, Controllers layerings).
- **Service Objects:** Logic extracted out of heavy controllers and fat models into dedicated `app/services` classes using `.call!` class methods to manipulate database state and perform verifications.
- **Background Jobs:** Sidekiq Worker naming conventions (`trust_score_worker.rb`).
- **Code Style:** Heavily relies on **RuboCop** for syntax and Rails configuration standardizing.
