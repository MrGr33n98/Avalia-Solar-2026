# Matriz de testes e evidências

## Execução isolada

RSpec foi executado na imagem `avalia-solar-2026-backend_test:latest`, usando PostgreSQL 14 descartável em tmpfs (`crm-prospecting-test-postgres`, database `avalia_solar_test`) e volume de bundle cache existente. Nenhum teste usou os containers ativos `ab0-postgres`/`ab0-redis` ou banco de produção.

## Evidência registrada

| Grupo | Resultado observado |
| --- | --- |
| Suíte Sales integral | `bundle exec rspec spec/requests/api/v1/sales spec/requests/api/v1/public_sales_tracking_spec.rb spec/requests/email_unsubscribe_spec.rb spec/services/sales spec/jobs/sales spec/models/sales spec/queries/sales spec/policies/sales` — 279 exemplos, 0 falhas, incluindo PostgreSQL descartável. |
| Forms públicos | `bundle exec rspec spec/requests/api/v1/sales/public_forms_spec.rb` — 5 exemplos, 0 falhas; chave opaca, allowlist, limite e dedupe. |
| Cadência, unsubscribe e provider SES MIME | `bundle exec rspec spec/services/sales/email_sequences/enrollment_processor_spec.rb spec/requests/email_unsubscribe_spec.rb spec/services/sales/messaging/providers/ses_spec.rb` — 12 exemplos, 0 falhas. |
| TypeScript frontend | `npm run typecheck` — passou (`tsc --noEmit`). |
| ESLint tela cadence | `npx eslint app/dashboard/sales/campaigns/sequences/page.tsx` — passou. |
| Lint script global Next | `npm run lint -- --file ...` percorreu outros módulos e falhou por erros preexistentes fora da tela; não foi usado como prova de falha do arquivo. |
| RSpec Sales abrangente (primeira rodada) | 198 exemplos, 31 falhas; fixtures legadas e defeitos foram corrigidos e reexecutados na rodada integral. |

## Cobertura já adicionada

- Revogação válida/repetida, cross-tenant, inexistente e sem autorização.
- Today owner padrão, tracking autenticado/sanitizado, webhook SNS, idempotência de send job e estado de campanha.
- Cadência email/task, pausa pelo kill switch, suppressão, repetição de processamento e unsubscribe GET/POST/forjado.
- MIME com `List-Unsubscribe` e `List-Unsubscribe-Post`, sem expor BCC no header.
- Form público com chave opaca, whitelist, limite, dedupe e campanha derivada do form.
- Tracking web público com chave/origem tenant-scoped, CORS, script, sessão anônima, evento idempotente/sanitizado, cross-tenant, payload e identity autenticada para Contact.

## Matriz restante antes do Go

| Área | Ainda precisa provar |
| --- | --- |
| Tenant/RBAC | A/B para manager e admin; bulk reassignment; permission matrix completa. |
| Email | SES staging aceita mensagem; delivery/bounce/complaint por SNS; retries provider reais; sem prospect real. |
| Campanha | snapshot→schedule→launch→batch→provider event→completion/metrics, double launch/scheduler e limites. |
| Cadência | delay de timezone, resume, failure/retry, reply inbound real e stop automático por reply. |
| Tracking | Browser/staging, consentimento no site, quota distribuída, form→Lead e identity→Contact→Opportunity/Won→attribution. |
| UI/E2E | Playwright sintético para lead reload/kanban, Today, email permitido, campanha, cadence e analytics após reload. |
