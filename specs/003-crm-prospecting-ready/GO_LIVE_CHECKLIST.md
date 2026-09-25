# Go-live checklist — CRM Prospecting Ready

Data: 2026-09-25. Branch: `feat/crm-prospecting-ready`. Não liberar prospecção ainda.

| Gate | Status | Evidência | Pendência |
| --- | --- | --- | --- |
| G0 Tenant Integrity | PASS | Tenant isolation, referential integrity, consent, Today, email, forms e tracking público estão na suíte: 279 exemplos, 0 falhas. | E2E cross-tenant em staging continua pendente. |
| G1 Security | PARTIAL | Consent/idempotência, Today owner, session/event tenant boundary, public key/origin CORS, SNS verifier e unsubscribe assinado têm testes. | Manager/admin/bulk matrix; throttle tracking é process-local; revisão security e staging E2E pendentes. |
| G2 Email Provider | BLOCKED | Health check, kill switch, provider errors fail-closed, headers unsubscribe implementados; testes usam provider double. | SES real, identidade, sandbox/quota, inbox de staging e delivery/bounce/complaint reais via SNS. |
| G3 Campaigns | PARTIAL | Preflight exige provider operational/switch; snapshot/dispatcher/jobs existentes e regressões testadas. | E2E staging, quota/rate caps, Redis lock fail-closed e completion/analytics real. |
| G4 Cadences | PARTIAL | Migration/model/enrollment scheduler/email/task UI; 12 specs novos relacionados passam. | Inbound reply inexistente/não comprovado; E2E de delay/retry/task Today/provider. |
| G5 Tracking & Attribution | PARTIAL | TrackingSite tenant-scoped, chave pública, origens/CORS allowlisted, sessão anônima gerada no servidor, eventos web idempotentes e identity autenticada para Contact; request specs passam. | Browser/staging E2E, consentimento de coleta no site, form→Lead, first/last touch até Opportunity/Won e rate limit distribuído pendentes. |
| G6 CRM UI | PARTIAL | Cadências e tracking usam APIs reais; tela configura origins e apresenta snippet tenant-scoped; TypeScript e ESLint focados passaram. | Jest Sales tem 2 falhas em `SalesCommandCenter` (provider ausente no helper e assertions incompatíveis com a UI atual); E2E e confirmação de Lead→Kanban após reload, Today, templates/inbox/analytics completos. |
| G7 Full Sales Suite | PARTIAL | RSpec Sales: comando listado abaixo, 279 exemplos, 0 falhas. Jest Sales: 9/10 suítes, 46/48 testes passaram. `npm run build` concluiu, com warnings de OpenTelemetry/Browserslist e cache warm sem backend. | Corrigir setup/contrato dos testes `SalesCommandCenter`; Playwright pendente; RuboCop focado reportou 97 offenses em 19 arquivos inspecionados. |
| G8 E2E Operational | BLOCKED | Nenhum E2E com provider/inbox de staging executado. | Caminho sintético descrito pelo prompt ainda precisa ser rodado em staging. |
| G9 Production Readiness | BLOCKED | Nenhuma migration aplicada em produção; nenhuma integração externa de produção validada. | Todos os gates críticos PASS, limites, observabilidade, runbooks e aprovação de deploy. |

## Decisão

**CRM CORE READY: não declarado ainda. EMAIL GO-LIVE BLOCKED.** Não utilizar prospects reais nem habilitar `SALES_EMAIL_SENDING_ENABLED` até fechar G2/G3/G4/G5/G8 e validar ambiente alvo. As três migrations foram aplicadas apenas em PostgreSQL descartável de teste; nenhuma migration de produção foi executada.

### Comandos de validação registrados

- `npm run typecheck` — passou.
- `npx eslint app/dashboard/sales/campaigns/sequences/page.tsx app/dashboard/sales/settings/tracking/page.tsx` — passou.
- `npm run build` — exit 0; compilou e gerou 221 páginas estáticas. Avisos: dependência dinâmica em OpenTelemetry/Prisma, Browserslist desatualizado e postbuild sem backend (fallback local gravado; nenhuma API foi alterada).
- `npm run test -- --runInBand __tests__/components/sales components/sales/campaigns` — 9 suítes passaram, 1 falhou; 46 testes passaram, 2 falharam em `SalesCommandCenter.test.tsx`.
- RuboCop dos sete arquivos novos de tracking — 7 arquivos, nenhum offense. RuboCop ampliado em 19 arquivos CRM — 97 offenses.
