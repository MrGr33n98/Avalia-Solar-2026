# Phase 1: Discovery, Auditoria e Proteção do Backend - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-05-30
**Phase:** 01-discovery-auditoria
**Mode:** assumptions
**Areas analyzed:** Backend Compatibility, Entitlements Mapping, UI Architecture, Telemetry & Tracking

---

## Assumptions Presented

### Area: Backend Compatibility
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| Nenhuma rota ou controller Rails será modificado, visto que a API expõe dados completos e estruturados de forma retrocompatível. | Confident | `companies_controller.rb` e `company_serializer.rb` | Quebra de endpoints ou latência na API. |

### Area: Entitlements Mapping
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| O frontend deve consultar estritamente a propriedade `feature_access` canonizada vinda da API Rails para liberar ou bloquear recursos visuais. | Confident | `PlanFeatureCatalog.rb` e `CompanyFeatureAccessResolver.rb` | Exibição inadequada de dados premium em contas gratuitas ou de planos básicos. |

### Area: Banners & Ads
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| Os novos slots de publicidade consumirão a estrutura e endpoints existentes no Rails, respeitando bloqueios de concorrentes em planos Pro. | Confident | `allowed_positions` no model de Banners | Exposição indevida de concorrentes diretos nos perfis corporativos pagos. |
