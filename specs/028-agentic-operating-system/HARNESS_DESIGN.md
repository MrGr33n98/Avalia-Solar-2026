# HARNESS_DESIGN.md — `cli-anything-avalia` (Fases 1 & 2)

## 1. Análise do Sistema Alvo (Fase 1)

O **Avalia Solar 2026** possui:
- **102 recursos no ActiveAdmin** (`AB0-1-back/app/admin/`) distribuídos em 11 domínios.
- **Serviços de domínio existentes em `AB0-1-back/app/services/`:**
  - `CompanyHealthService` (score 0–100 nas dimensões `profile`, `reputation`, `content`, `discoverability`, `integration`)
  - `NextBestActionService` (recomendações priorizadas 60..95)
  - `IntentScoringService` (sinais de compra com decaimento de 7 dias)
  - `TrustScore::CalculationService`
  - `Mcp::RiskClassifier` & `Mcp::ApprovalPolicyService` (governança `R0..R4`)
  - `Sales::AccountDuplicateDetector`
- **Gargalo identificado:** Executar `bundle exec rails runner` a cada comando CLI leva **9 a 12 segundos** de boot e consome ~300 MB de RAM por processo.

---

## 2. Arquitetura do Conector Zero-Boot (`avalia_backend.py`) (Fase 2)

Para atingir latência **< 350 ms** sem risco de `OOMKilled` nos containers:

1. **Execução Fast-Path SQL/JSON (`psql` via Docker local ou SSH remoto com JSON aggregation):**
   - Comandos `R0` e `R1` (`founder briefing`, `billing drift-audit`, `billing plans-list`, `company health`, `company claims-list`, `reputation queue`, `revenue upgrade-candidates`, `leads stuck`, `curation audit`) executam queries SQL parametrizadas que retornam JSON diretamente do PostgreSQL (`ab0-postgres`) em **~20–80 ms**, sem inicializar o processo Ruby/Rails!
2. **Execução Transacional Auditada (Plan/Apply para `R2` e `R3`):**
   - Comandos mutáveis (`billing grant-plan`, `company approve-claim`, `reputation moderate`):
     - Em `--dry-run` (ou `--plan`): consultam o estado atual (`before_state`) via Fast-Path SQL e retornam o plano de execução (`plan_id`, `before`, `after`, `requires_approval`) em milissegundos, **sem tocar no banco**.
     - Em execução real (sem `--dry-run`): exigem obrigatoriamente `--reason` (mínimo de 5 caracteres) e aplicam a mutação dentro de uma transação atômica com registro de auditoria.

---

## 3. Contrato Canônico de Saída (`--json`)

Todos os comandos da CLI, quando invocados com `--json`, retornam exatamente o envelope abaixo em `stdout` com exit code `0` (sucesso), `1` (erro operacional) ou `2` (erro de validação/uso):

```json
{
  "ok": true,
  "command": "billing.drift-audit",
  "env": "local",
  "risk_tier": "R0",
  "dry_run": false,
  "data": {},
  "meta": {
    "duration_ms": 42,
    "timestamp": "2026-11-27T17:48:00Z",
    "version": "0.1.0"
  }
}
```

