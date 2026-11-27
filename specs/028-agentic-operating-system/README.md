# Spec 028 — Avalia Solar Agentic Operating System (`cli-anything-avalia`)

**Status:** Em implementação (Wave 1 — Founder MVP Quick Wins)  
**Branch:** `feat/spec-028-avalia-cli-anything`  
**Metodologia:** [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) (7-Phase Agent-Native CLI Pipeline)

---

## 1. Objetivo Estratégico

Transformar o backoffice administrativo (102 recursos do ActiveAdmin em 11 domínios) e os motores de inteligência existentes em `AB0-1-back/app/services/` em uma infraestrutura **Agent-Native**, operável em milissegundos tanto pelo Founder no terminal quanto por agentes de IA (Antigravity, Claude Code, Hermes Agent) via saída JSON determinística e modelo de governança **Plan/Apply (`R0..R3`)**.

---

## 2. Metas e OKRs da Fase 1 (MVP Founder)

| ID | Indicador | Baseline | Meta | Critério de Aceite |
|---|---|---|---|---|
| **M1** | Tempo do Ritual Diário do Founder | ~45 min em telas do ActiveAdmin | **< 5 min** | Execução completa do briefing, healthcheck, filas e auditoria comercial via CLI |
| **M2** | Latência de Leitura (Zero-Boot SQL/HTTP) | 9.000–12.000 ms (`rails runner`) | **< 350 ms** | Consultas `R0`/`R1` via conector rápido Postgres/HTTP sem boot completo do Rails |
| **M3** | Blindagem Comercial (Zero Drift) | Auditoria manual de `price_id` | **100% automatizada** | `avalia billing drift-audit --json` validando unicidade de Stripe Price IDs e planos públicos |
| **M4** | Governança Plan/Apply | Alterações diretas sem preview | **100% com `--dry-run` e `--reason`** | Comandos `R2`/`R3` exigem `--reason` e exibem `before`/`after` em `--dry-run` |
| **M5** | Cobertura de Testes do Harness | 0 testes | **100% verde (`pytest`)** | Suíte unitária + E2E de subprocesso documentada em `TEST.md` |

---

## 3. Catálogo de Comandos Essenciais Implementados (`cli-anything-avalia` / `avalia`)

| Grupo | Comando | Risco | Descrição |
|---|---|:---:|---|
| **`founder`** | `avalia founder briefing` | `R0` | Resumo executivo matinal: contadores reais de filas pendentes (`CompanyAccessRequest`, `Review`, `PendingChange`, `CompanyHeroSlide`, `Lead`) e distribuição de planos. |
| **`system`** | `avalia system doctor` | `R0` | Diagnóstico de saúde da stack (PostgreSQL, Redis, API HTTP/MCP, tabelas críticas e filas). |
| **`billing`** | `avalia billing drift-audit` | `R0` | Audita catálogo de planos, unicidade de `stripe_price_id_monthly` / `yearly`, ocultamento de planos legados e empresas em planos pagos sem assinatura Stripe ativa. |
| **`billing`** | `avalia billing plans-list` | `R0` | Lista os planos comerciais cadastrados, preços, visibilidade (`/pricing`) e IDs do Stripe. |
| **`billing`** | `avalia billing grant-plan` | `R3` | Atribui/atualiza plano de uma empresa com suporte a `--dry-run` e registro em `plan_configuration_audits` / auditoria. |
| **`company`** | `avalia company health <id>` | `R0` | Calcula o Profile Completion & Health Score (0–100 em 5 dimensões) e recomendações priorizadas (`NextBestAction`). |
| **`company`** | `avalia company claims-list` | `R0` | Lista solicitações pendentes de reivindicação de perfil (`company_access_requests`). |
| **`company`** | `avalia company approve-claim <id>` | `R2` | Aprova reivindicação de empresa com suporte a `--verify-badge`, `--reason` obrigatório e `--dry-run`. |
| **`reputation`** | `avalia reputation queue` | `R0` | Lista avaliações pendentes de moderação (`reviews`) com nota, comentário e status. |
| **`reputation`** | `avalia reputation moderate <id>` | `R2` | Aprova ou rejeita uma avaliação (`--action approve\|reject`) com `--reason` e `--dry-run`. |
| **`revenue`** | `avalia revenue upgrade-candidates` | `R1` | Identifica empresas no tier `Free` ou sem plano com maior pontuação de intenção (`intent_scores`), leads ou avaliações para abordagem comercial. |
| **`leads`** | `avalia leads stuck` | `R0` | Lista leads recentes do marketplace aguardando atendimento além da janela configurada (`--older-than`). |
| **`curation`** | `avalia curation audit` | `R1` | Audita qualidade cadastral por UF e detecta possíveis duplicidades de nome ou domínio entre empresas. |
| **`aeo`** | `avalia aeo validate-storefront` | `R0` | Valida a saúde e o tempo de resposta da API pública e Storefront para descoberta por agentes de IA. |

---

## 4. Tasklist de Execução (7 Fases CLI-Anything)

- [x] **T01** Isolar worktree `.worktrees/spec-028-cli-anything` na branch `feat/spec-028-avalia-cli-anything` e instalar metodologia em `.agents/skills/cli-anything/`.
- [x] **T02** Documentar `HARNESS_DESIGN.md` (Fases 1 e 2: Análise e Arquitetura Zero-Boot + Plan/Apply).
- [x] **T03** Implementar pacote `tools/avalia-cli/` (`cli_anything.avalia`) com `ReplSkin`, conector híbrido (`local` Postgres/HTTP + `prod` SSH/Docker seguro) e os 9 grupos de comandos.
- [x] **T04** Planejar (`TEST.md`) e implementar suíte de testes automatizados (`pytest`) cobrindo contratos JSON, modo REPL, `--dry-run` e validação de erros (14/14 passing).
- [x] **T05** Gerar `.agents/skills/cli-anything-avalia/SKILL.md` e `tools/avalia-cli/cli_anything/avalia/skills/SKILL.md`.
- [x] **T06** Instalar pacote (`pip install -e tools/avalia-cli`) e executar smoke tests reais contra o ambiente local/produção (`R0`).

