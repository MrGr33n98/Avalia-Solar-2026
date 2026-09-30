# PHASE II-B — PRODUCTION DRY-RUN REPORT
## CTA Breakdown / Partial Historical Reconstruction
## company_id = 372
## Ambiente: PRODUÇÃO (ab0)

---

# 1. OBJETIVO & EXECUÇÃO

Execução do primeiro dry-run contra os dados reais de produção para a empresa `company_id = 372` no período auditado de `2026-07-02` a `2026-09-29` (`90d`, `America/Sao_Paulo`).

Configuração de execução:
- `DRY_RUN=true`
- `COMPANY_ID=372`
- `FROM_DAY=2026-07-02`
- `TO_DAY=2026-09-29`
- `RAILS_ENV=production`
- `database=ab0`

---

# 2. IDENTIDADE DO CÓDIGO (CONTAINER VS REPOSITÁRIO)

| Arquivo | SHA256 Repositório (`AB0-1-back/`) | SHA256 Container (`ab0-backend`) | Match |
|---|---|---|---|
| `app/services/analytics/event_taxonomy.rb` | `456b0e19557acea0050be97ccbf9ae61d790ebc1f9368aec8b9ab5e7d92a3ce7` | `456b0e19557acea0050be97ccbf9ae61d790ebc1f9368aec8b9ab5e7d92a3ce7` | YES |
| `app/workers/analytics/aggregation_worker.rb` | `23465431488f623c802dbcb2a7f7cd28fd63013d7f0ce385c33a5411f01491ac` | `23465431488f623c802dbcb2a7f7cd28fd63013d7f0ce385c33a5411f01491ac` | YES |
| `app/services/analytics/partial_backfill_service.rb` | `e00d2c7cafd56d9be3e45feaf6793ba2bde9f72149f3e6515ecaf7d5dd2b58d2` | `e00d2c7cafd56d9be3e45feaf6793ba2bde9f72149f3e6515ecaf7d5dd2b58d2` | YES |
| `lib/tasks/analytics.rake` | `46804cab304d99c767709366d8bab09f5e2f8701a0e598fe78285c40b9770e1f` | `46804cab304d99c767709366d8bab09f5e2f8701a0e598fe78285c40b9770e1f` | YES |

---

# 3. BASELINE DE PRODUÇÃO (BEFORE)

Snapshot capturado antes do dry-run no range `2026-07-02` até `2026-09-29`:

```text
total: 112
whatsapp: 0
email: 0
phone: 0
website: 0
quote: 0
classified: 0
other: 112
```

---

# 4. MATRIZ DE IMPACTO PROJETADO (BEFORE VS PROJECTED)

| Metric | Current production | Projected after backfill | Delta |
|---|---:|---:|---:|
| total | 112 | 112 | 0 |
| whatsapp | 0 | 0 | 0 |
| email | 0 | 0 | 0 |
| phone | 0 | 0 | 0 |
| website | 0 | 0 | 0 |
| quote | 0 | 17 | +17 |
| classified | 0 | 17 | +17 |
| other | 112 | 95 | -17 |

---

# 5. PLANEJAMENTO POR DIA (11 DIAS QUE SERIAM ALTERADOS)

| Day | Total | Quote Before | Quote Projected | Classified Projected | Other Projected | Change |
|---|---:|---:|---:|---:|---:|---|
| 2026-07-25 | 2 | 0 | 2 | 2 | 0 | YES |
| 2026-07-26 | 1 | 0 | 1 | 1 | 0 | YES |
| 2026-07-28 | 2 | 0 | 2 | 2 | 0 | YES |
| 2026-08-06 | 2 | 0 | 2 | 2 | 0 | YES |
| 2026-08-08 | 13 | 0 | 1 | 1 | 12 | YES |
| 2026-08-09 | 13 | 0 | 1 | 1 | 12 | YES |
| 2026-08-14 | 18 | 0 | 2 | 2 | 16 | YES |
| 2026-08-17 | 26 | 0 | 2 | 2 | 24 | YES |
| 2026-08-25 | 10 | 0 | 1 | 1 | 9 | YES |
| 2026-08-27 | 13 | 0 | 1 | 1 | 12 | YES |
| 2026-09-24 | 12 | 0 | 2 | 2 | 10 | YES |

---

# 6. VERIFICAÇÃO DE ZERO MUTAÇÃO NO BANCO (BEFORE VS AFTER)

Após a execução do dry-run (`DRY_RUN=true`), o snapshot da tabela `company_daily_stats` foi re-executado.

Resultados:
- `BEFORE_TOTAL = 112`, `AFTER_TOTAL = 112`
- `BEFORE_QUOTE = 0`, `AFTER_QUOTE = 0`
- `BEFORE_OTHER = 112`, `AFTER_OTHER = 112`
- `updated_at` permaneceu rigorosamente **idêntico** em todos os 74 registros do range.
- `DATABASE_DIFF = ZERO` (100% comprovado por query).

---

# 7. CONCILIAÇÃO HISTÓRICA

- Raw reconstructable events no range: `17` (`quote` / `quote_request` / `request_quote`)
- Reconstrução projetada para `quote`: `17`
- Aggregate-only preservados em `other`: `95`
- Total final: `112 = 17 classified + 95 residual` (zero perdas, zero adições sintéticas).
