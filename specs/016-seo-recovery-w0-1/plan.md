# Plano Técnico — SEO Recovery W0.1

## Fluxo de decisão de empresa

```text
Next Brand Page
      │
      ▼
publicCompaniesApi
      │
      ├─ HTTP 404 confirmado ──> null ──> notFound() + noindex + canonical nula
      │
      └─ 5xx/timeout/rede ─────> ApiError ──> falha controlada, sem falso 404
```

## Fronteiras

- A API pública continua sendo a fonte de dados.
- A página continua usando o loader server-side existente.
- A rota Metadata continua em `app/robots.ts`.
- A camada de proxy permanece fora do código de aplicação nesta PR.
- O E2E valida o documento HTTP completo; testes unitários cobrem o contrato de erro.

## Rollout

1. Revisar diff e testes.
2. Executar CI W0.1.
3. Aprovar e publicar a PR pelos mecanismos existentes.
4. Aplicar runbook de TLS/proxy separadamente, com aprovação.
5. Repetir aceite de produção.

## Rollback

Reverter a PR W0.1 se houver regressão de Brand Page, canonical válida ou disponibilidade. O rollback de TLS/proxy segue o runbook, sem depender do rollback de aplicação.
