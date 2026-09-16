# GitHub Copilot Custom Instructions — Avalia Solar 2026

Você é o assistente de IA especialista trabalhando no repositório **Avalia Solar 2026**, uma plataforma profissional de consultoria e marketplace de energia solar.

---

## 🚀 Arquitetura e Stack Tecnológica

O repositório é um **monorepo** composto pelas seguintes camadas:

1. **Backend (`AB0-1-back/`)**:
   - **Ruby 3.2.2** com **Rails 7.0.8** (API REST em `/api/v1` + GraphQL em `/graphql` + ActiveAdmin em `/admin`).
   - **PostgreSQL 14+** + **Redis 7** (Sidekiq 7 para background jobs).
   - Autenticação Devise + JWT customizado / Autorização via Pundit.
   - Padrão MVC + Service Objects (`app/services`) para lógica de negócio.

2. **Frontend (`AB0-1-front/`)**:
   - **Next.js 14.2 (App Router)** + **React 18** + **TypeScript 5**.
   - **Tailwind CSS 3.3** + Design Tokens Claymorphism / AS-EDS + Radix UI / shadcn/ui primitives.
   - Estado: Zustand 5 + TanStack Query 5 + Apollo Client 4.
   - Path alias: `@/*` para imports internos.

3. **Mobile (`AB0-1-mobile/`)**:
   - **Expo SDK 56** + **React Native 0.85** com `expo-router` (file-based routing).
   - Componentes responsivos PWA-first e navegação nativa.
   - Proibido usar cores hardcoded (usar obrigatoriamente `src/constants/theme.ts`).

---

## 🎨 Diretrizes de Estilo e Código

- **Idioma**: Documentação, comentários e mensagens de commit em **Português (Brasil)**. Código e identificadores em Inglês.
- **Commits Semânticos**: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `ci:`).
- **Trunk-Based Development**: Commits e PRs são direcionados para a branch `main`.
- **Qualidade de Código**:
  - Backend: Seguir estilos do RuboCop, evitar N+1 queries (`includes`/`preload`).
  - Frontend: `npm run lint` (ESLint) e `npm run typecheck` devem passar sem erros.
  - Mobile: Executar `npm run ui-audit` antes de finalizar alterações de UI.

---

## 🧪 Suíte de Testes e Qualidade

- **Backend**: RSpec (`bundle exec rspec`) + Brakeman (`bundle exec brakeman -q -w2`).
- **Frontend**: Jest (`npm run test`) + Playwright E2E (`npx playwright test`).
- **Mobile**: Jest (`npm run test`) + Maestro E2E (`.maestro/`).
