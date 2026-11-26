# Spec 020 — TEST PLAN

## 1. Níveis

| Nível | Ferramenta | Escopo | AC |
|---|---|---|---|
| Unidade | RSpec | `Canonical`, `Envelope`, `Logger`, `PromptRegistry`, `CompletionService` | AC-02, AC-05, AC-13, AC-14 |
| Propriedade | RSpec (gerador próprio, sem gem nova) | determinismo e colisão do `evidence_id` | AC-02 |
| Request | RSpec request specs em `/mcp` e `/mcp/private` | flags ON/OFF, erro, quota, OAuth | AC-01, AC-03, AC-04, AC-12 |
| Contrato | `mcp-remote-contract-gate` (existente) | sem alterar expectativa | AC-03 |
| Interop | `mcp-c4-sdk-interop-staging` (existente + prompts e completion) | SDK python/ts | AC-15 |
| Performance | benchmark RSpec | overhead de evidência e completion | AC-08, AC-14 |
| Build | script Node em CI | `dist/` invariante; `dist-analysis/` com maps | AC-06 |
| Evidência | `evidence-lab` (REA) | contrato, análise, screenshots, diff | AC-06b, AC-07, AC-09, AC-16, AC-17 |
| E2E UI | Playwright existente (`widgets.spec.ts`) | sem regressão | — |
| Segurança | grep no workflow, Brakeman, Gitleaks | isolamento e segredos | AC-11 |

## 2. Casos principais

1. `list_integrators` com a flag ON → `_meta.avaliasolar/evidence.evidence_id` casa com `^asev_[0-9a-f]{64}$`.
2. Mesmo input duas vezes → mesmo `evidence_id`; `request_id` diferente.
3. Alterar 1 campo do `structuredContent` (stub) → `content_sha256` e `evidence_id` diferentes.
4. `cursor` diferente → `evidence_id` diferente (o digest do cursor entra no hash).
5. Tool com erro de validação → `_meta` sem `content_sha256`.
6. `/mcp/private` → `_meta` sem tenant; log com `tenant_digest` e sem `company_id`.
7. Flag OFF → resposta byte a byte igual à baseline gravada antes da mudança.
8. Quota excedida → nenhum evento `mcp.evidence` com `status: ok`.
9. `prompts/get find_local_integrator` com `state=SC` → mensagens citando `list_solar_categories` e `list_integrators`.
10. `completion/complete` em `category_slug`, prefixo `"aq"` → só categorias ativas que começam com `aq`.
11. `completion/complete` com prefixo de 1 caractere → máximo de 20 valores (`MAX_LIMIT`).
12. `tools/list` ∩ nomes REA = ∅.

## 3. Dados

- Só fixtures e factories; **nenhum** dump de produção.
- Lab: `packages/mcp-ui/src/fixtures/staging-fixtures.ts`.
- Spec 019: seed sintético no `docker-compose.test.yml`. O guard que bloqueia test DB no host de produção (T022 da 019) **não** deve ser contornado.

## 4. Execução local mínima antes do PR

```bash
cd AB0-1-back && bundle exec rspec spec/services/mcp/evidence spec/requests/mcp   # via ambiente Docker do repo
cd packages/mcp-ui && npm run verify && node scripts/build.mjs --analysis
rea inspect-api-contract AB0-1-back/swagger/v1/swagger.json --format json > /dev/null
```
