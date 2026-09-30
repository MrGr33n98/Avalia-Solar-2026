# CTA Breakdown — Phase II Remediation

## Baseline Evidence

Reconciliação forense final aprovada para `company_id = 372` (WEG) no range da UI (`2026-07-02` a `2026-09-29`, `90d`, `America/Sao_Paulo`):
- `company_daily_stats`: **112 CTA total** (`cta_clicks = 112`, `whatsapp` = 0, `email` = 0, `phone` = 0, `website` = 0, `quote` = 0).
- `platform_events` / `analytics_events` no mesmo range: **17 CTA raw events** (16 `quote` + 1 `request_quote`).
- Cliques agregados sem raw event correspondente: **95 cliques** (acumulados em 7 dias específicos de Agosto/Setembro).
- Equação exata do range: `112 = 17 (raw) + 95 (aggregate-only)`.

---

## Root Causes

1. **`Analytics::AggregationWorker` omission**: A query SQL em `sql_company` omitia a coluna `quote_clicks` no `INSERT` e no `ON CONFLICT DO UPDATE`. Todos os eventos de orçamento processados pelo worker incrementavam `cta_clicks` em 1 mas deixavam `quote_clicks` como `0`.
2. **Migration sem backfill**: A coluna `quote_clicks` foi adicionada em 2026-09-21 (commit `973fbf64`), deixando 22 dos 24 eventos quote-like all-time em período pre-migration sem coluna correspondente na época.
3. **Vocabulário não-canônico**: Presença de eventos brutos com `cta_type` = `request_quote` e `quote_request`.

---

## Code Changes

1. `AB0-1-back/app/workers/analytics/aggregation_worker.rb`:
   - Adicionada constante `QUOTE_CLICK_EVENTS = ['company_cta_quote', 'Quote Request CTA Clicked', 'quote_click'].freeze`.
   - Atualizado `sql_company` para incluir `filter_quote = count_filter(...)` suportando `quote`, `request_quote` e `quote_request`.
   - Incluída a coluna `quote_clicks` nas cláusulas `INSERT INTO company_daily_stats` e `ON CONFLICT (company_id, day) DO UPDATE SET quote_clicks = company_daily_stats.quote_clicks + EXCLUDED.quote_clicks`.
2. `AB0-1-back/app/services/analytics/event_taxonomy.rb`:
   - Formalizados os aliases `request_quote` -> `quote` e `quote_request` -> `quote` em `CTA_TYPES` e `ALIASES`.
   - Adicionado método `canonical_cta_type(raw_cta_type)`.
3. `AB0-1-back/app/services/analytics/partial_backfill_service.rb`:
   - Criado serviço de backfill parcial não-aditivo e idempotente.
4. `AB0-1-back/lib/tasks/analytics.rake`:
   - Criada a rake task `analytics:partial_backfill_daily_stats` (modo `DRY_RUN=true` por padrão).

---

## Taxonomy Changes & Alias Semantics

Análise detalhada dos produtores de `request_quote` e `quote_request` provando que todos pertencem ao domínio de CTA de Orçamento da empresa:

| File / Location | Event / cta_type | Domain | company_id present? | Meaning | Safe global alias to quote? |
|---|---|---|---|---|---|
| `AB0-1-front/components/ui/CTAPrimaryButton.tsx:16` | `quote_request` | Company CTA | YES | Botão CTA de Orçamento no perfil | YES |
| `AB0-1-front/app/products/[slug]/ProductDetailClient.tsx:511` | `request_quote` | Product/Company CTA | YES | Solicitação de cotação do fornecedor | YES |
| `AB0-1-front/app/dashboard/components/tracking/UtmLinkBuilder.tsx:22` | `quote_request` | Dashboard Link Builder | YES | Destino de solicitação de orçamento | YES |
| `AB0-1-back/app/models/creator_lead.rb:6` | `request_quote` | Creator Lead Intent | YES | Intenção de orçamento de empresa | YES |
| `AB0-1-back/app/admin/leads.rb:21` | `quote_requested_company_id` | Lead Admin Scope | YES | Vínculo de orçamento com a empresa | YES |

---

## Aggregation Changes

Invariante do Aggregation Worker:
- `typed = whatsapp_clicks + email_clicks + phone_clicks + website_clicks + quote_clicks`
- `typed <= cta_clicks` (Eventos classificados participam do total uma única vez).
- `other = [cta_clicks - typed, 0].max` (Eventos não classificados ou legados sintéticos mantidos no residual).

---

## Legacy Data Policy

- **Total Preservation**: O total de `cta_clicks` historicamente acumulado (**112**) é estritamente mantido (`TOTAL BEFORE == TOTAL AFTER`).
- **No Invented Channels**: Os 95 cliques sintéticos/legados permanecem em `other` (`residual_other = 112 - 17 = 95`). NENHUM canal fictício é atribuído aos 95 cliques irrecuperáveis.
- **Status de Reconstrução**: 17 cliques elegíveis para reconstrução futura via raw events. `production_applied: NO`.

---

## Backfill Design

- **Service**: `Analytics::PartialBackfillService`
- **Característica Principal**: **NÃO-ADDITIVO / IDEMPOTENTE**.
- **Fórmula de Reconciliação**:
  - `quote_after = MAX(quote_before, raw_quote_count)`
  - `classified_after = whatsapp_after + email_after + phone_after + website_after + quote_after`
  - `total_after = total_before` (Preservado)
  - `residual_other_after = total_after - classified_after`
- **Invariante**: Se `classified_after > total_before`, o serviço aborta a operação.

---

## Idempotency

- Múltiplas execuções do `PartialBackfillService` no mesmo intervalo produzem o exato mesmo resultado (`total_before == total_after`, `quote_after == 17`, `other_after == 95`).
- Nenhuma duplicação de `cta_clicks` (`112` nunca vira `129`).

---

## Verification Gate

### Repository
- **Branch**: `main`
- **HEAD**: `5e2e9f06701020b6e5d0a30646ab2533d64a42fb`
- **Working Tree**: Preservado com alterações de patch locais.

### Test DB Isolation
- **Rails env**: `test`
- **Database**: `ab0_test` (Totalmente isolado de produção `ab0`).
- **Proof**: Executado com sucesso em banco isolado ab0_test.
- **Resultado de Isolamento**: `env=test`, `db=ab0_test`.

### Alias Semantics
- **`request_quote`**: Call-sites em `CTAPrimaryButton.tsx`, `ProductDetailClient.tsx`, `UtmLinkBuilder.tsx`, `creator_lead.rb`, `leads.rb`. Mapeado para `quote` (solicitação de orçamento do fornecedor).
- **`quote_request`**: Mapeado para `quote` (variante sintática do frontend).
- **Aprovação**: Todos os produtores validados. Mapeamento global seguro.

### Verification Suite — Real RSpec Execution (6/6 Examples Passed)
- **Runner**: `bundle exec rspec`
- **Spec Files Executed**:
  1. `spec/workers/analytics/aggregation_worker_spec.rb`
  2. `spec/services/analytics/partial_backfill_service_spec.rb`
  3. `spec/requests/api/v1/company_dashboard_analytics_spec.rb`
- **Examples**: 6
- **Failures**: 0
- **Pending**: 0
- **Exit Code**: 0

| Spec File / Test Case | Type | Expected | Executed RSpec Result | Result |
|---|---|---|---|---|
| `aggregation_worker_spec.rb`: Public vs Internal | Worker | Only public events counted | `profile_views=1, cta_clicks=1, whatsapp=1` | PASSED |
| `aggregation_worker_spec.rb`: Quote & Aliases | Worker | `quote_clicks=2, cta_clicks=2` | `cta_clicks=2, quote_clicks=2, whatsapp=0` | PASSED |
| `aggregation_worker_spec.rb`: 5 Canonical Types | Worker | `cta=5, classified=5, typed<=cta` | `cta_clicks=5, typed=5` | PASSED |
| `partial_backfill_service_spec.rb`: Non-additive Backfill | Service | Total 112 preserved, dry_run=true zero writes | `cta_clicks=112, quote_clicks=2, other=110` | PASSED |
| `company_dashboard_analytics_spec.rb`: 1 Quote API | Request | HTTP 200, `quote=1, total=1, other=0` | `HTTP 200, { cta_breakdown: { quote: 1, total: 1, other: 0 } }` | PASSED |
| `company_dashboard_analytics_spec.rb`: Residual API | Request | HTTP 200, `total=112, quote=17, other=95` | `HTTP 200, { cta_breakdown: { quote: 17, total: 112, other: 95 } }` | PASSED |

### Syntax & Typecheck Validation
- **Backend Syntax (`ruby -c`)**: `Syntax OK` (`aggregation_worker.rb`, `event_taxonomy.rb`, `partial_backfill_service.rb`).
- **Frontend Typecheck (`tsc --noEmit`)**: `PASSED` (0 erros).

### Credential Hygiene
- **previous_exposure_detected**: YES
- **secret_repeated**: NO
- **rotation_recommended**: YES

### Production State & Safety
- **`ab0` business database mutations**: NONE
- **Production business data mutations**: NONE
- **`ab0_test` created**: YES
- **Production deploy**: NO
- **Production backfill**: NO


---

## Production Rollout Plan

1. **Deploy do Fix de Pipeline**: Deploy das alterações em `AggregationWorker`, `EventTaxonomy` e `PartialBackfillService`.
2. **Monitoramento do Pipeline Futuro**: Observar novas agregações por 24-48h e confirmar que novos eventos `quote` incrementam `quote_clicks` e `cta_clicks` sem `double-counting`.
3. **Backfill DRY-RUN em Produção**: Executar `COMPANY_ID=372 DRY_RUN=true rake analytics:partial_backfill_daily_stats` para inspecionar a saída do relatório diff.
4. **Aprovação Humana**: Revisar o relatório diff do dry-run.
5. **Execução Controlada**: Rodar `COMPANY_ID=372 DRY_RUN=false rake analytics:partial_backfill_daily_stats`.

---

## Rollback Plan

Em caso de qualquer anomalia:
- O `PartialBackfillService` grava log detalhado das alterações por dia (`day`, `total_before`, `quote_before`).
- Como a operação é não-aditiva e limita-se a atualizar a coluna `quote_clicks`, o rollback pontual pode redefinir `quote_clicks = 0` para restabelecer a fotografia anterior sem afetar `cta_clicks`.

---

## Remaining Risks

- Eventos legados antes de Março/2026 em outras empresas do sistema podem conter outros aliases não mapeados. O residual `other` garante resiliência visual e analítica nesses casos.
