# Guia de Implantação MCP7

- Backend
  - Executar migrações: `rails db:migrate`
  - Definir envs: `BETTER_AUTH_SECRET`, `JWT_SECRET` (opcional), `BLOCKED_IPS`
- Frontend
  - Definir envs: `NEXT_PUBLIC_BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`
  - Build: `npm run build`
- Providers
  - Google: configurar URIs de redirecionamento
  - LinkedIn: habilitar produto OIDC e URIs
- CI
  - Habilitar workflow CI
  - Validar cobertura mínima
