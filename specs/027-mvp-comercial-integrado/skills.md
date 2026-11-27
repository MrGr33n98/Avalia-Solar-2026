# Skills, agentes e ferramentas — Spec 027

Todas as skills abaixo existem nesta instalação do Claude Code (verificado em 27/11/2026). Leia o `SKILL.md` antes de usar cada uma.

## Por fase

| Fase | Skills | Para quê |
|---|---|---|
| Decisões (D1–D7) | `pricing`, `paywalls`, `product-lens`, `product-capability`, `revops` | Estrutura de planos, upsell, empacotamento e o que é defensável vender |
| F0 — Stripe/admin | `pricing`, `release-management` | Price IDs por período e checklist de mudança de preço |
| F1 — Backend | `systematic-debugging`, `root-cause-analysis`, `multi-tenancy`, `security-audit`, `feature-flags` | Aplicação no backend, matriz de conformidade e 403 corretos |
| F1 — Front | `vercel-react-best-practices`, `paywalls`, `playwright` | FeatureGuard com `unlock_plan` e E2E por plano |
| F1 — Vitrine/MCP | `mcp-builder`, `schema` | Ferramenta MCP executável e JSON-LD |
| F2 — Métricas | `analytics`, `attribution`, `conversion-tracking`, `add-analytics-instrumentation`, `taxonomy`, `dashboards` | Definição única de métricas, origem do lead e `ai_agent_type` |
| F3 — Conversão | `paywalls`, `signup`, `onboarding`, `ab-testing` | Aba "Plano e recursos", CTA de upgrade e teste A/B do upsell |
| F4 — Dados | `data-migration`, `database-operations` | Backfill de `plan_id` reversível |
| Release | `ci-pipelines`, `progressive-delivery`, `release-management` | Gate de conformidade no CI e liberação gradual |
| Spec e governança | `speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-checklist`, `speckit-converge` | Formalizar e fechar sem drift |

## Agentes de revisão (EGM)
Para mudanças não triviais (T011, T015, T031, T050), use o processo Elephant-Goldfish (`docs/architecture/ELEPHANT-GOLDFISH-WORKFLOW.md`):
- `egm:egm-design` e `egm:egm-codebase-details` para o desenho do `unlock_plan` e do `PeriodSummary`;
- `egm:egm-implementation-readiness` antes de codar;
- `egm:egm-zoom-out` para checar escopo.

## MCPs úteis
| MCP | Uso |
|---|---|
| Claude in Chrome | Auditoria do admin e do dashboard **somente leitura** (o login é feito pelo usuário) |
| Playwright | E2E com fixtures por plano |
| Google Analytics | Conferir `generate_lead`, `upgrade_cta_clicked` e `ai_agent_type` no GA4 |
| Context7 | Documentação atual de Stripe, Next e TanStack Query |

## Regras
- Nunca alterar plano, preço ou empresa em produção pelo navegador sem pedido explícito. Mudanças de configuração (F0) são feitas pelo usuário.
- Não inventar métricas: sem dado real, o dashboard mostra o estado vazio.
- Migração de dados (T050) só com aprovação e com rollback testado.
