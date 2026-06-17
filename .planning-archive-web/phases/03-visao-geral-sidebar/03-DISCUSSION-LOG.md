# Fase 3: Visão Geral Premium e Sidebar - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-05-30
**Phase:** 03-visao-geral-sidebar
**Mode:** assumptions
**Areas analyzed:** Contact Protection & Signup Gate, Competitor Suppression, Dynamic Highlights, FAQ Telemetry

---

## Assumptions Presented

### Area: Contact Protection & Signup Gate
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| O e-mail e telefone públicos serão censurados e revelarão apenas após o login, disparando `openSignupGate` para usuários não autenticados. | Confident | Lógica ativa em `CompanySidebar.tsx` | Perda de captação de registros orgânicos e leads identificados no portal. |

### Area: Competitor Suppression
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| Concorrentes e banners rivais no rodapé e barra lateral serão ocultados por completo se a empresa tiver o entitlement `show_alternatives = false`. | Confident | `show_alternatives` e `show_competitor_banners` lidos de `feature_access` | Insatisfação e perda de exclusividade de parceiros comerciais dos planos Pro/Enterprise. |

### Area: Dynamic Highlights
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| O grid de destaques rápidos no topo do Overview consumirá dados dinâmicos do ano de fundação, contagens de produtos e nota estelar em tempo real. | Confident | Propriedades disponíveis no payload de `CompanyDetailClient.tsx` | Exibição de dados obsoletos ou estáticos incoerentes com as tabelas da empresa. |
