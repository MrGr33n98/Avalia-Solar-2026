# Discovery — Evidência Real do Estado Atual (Phase 0)

## 1. Git Preflight
- **BASE_SHA:** `658dafab8a416b780046aaa08b9f0f15de43f416` (`origin/main`)
- **BRANCH:** `feat/company-identity-badges-v2`
- **HEAD_SHA:** `785828db07ab7292fd1c68fad6dab27aa089d7b3`
- **WORKTREE:** Integrado em `C:/Users/Bobi/Desktop/AB0-1-main`
- **Untracked Preservado:** `interface-design/` intacto.

---

## 2. Matriz de Inventário Real de Consumidores (15 Campos)

| Campo | Source of Truth | Serializer | API | Frontend Consumer | Mobile Consumer | Significado de Negócio | Status / Diagnóstico |
|---|---|---|---|---|---|---|---|
| `verified` | `companies.verified` (bool) | `CompanySerializer`, `CompanyCardSerializer`, `Search::CompanyResultSerializer` | `/api/v1/companies/:id`, `/api/v1/companies`, GraphQL `is_verified` | `CompanyIdentityLine`, `CompanyIdentityCard`, `CompanyVerificationBadge` | `src/app/company/[id].tsx` (`ShieldCheck`) | Validação jurídica e cadastral oficial pela plataforma | Válido, mas confundido na UI com plano comercial ("PRO/Premium") |
| `verified_badge` | ActiveStorage Attachment (`Company#verified_badge`) | `verified_badge_image_url`, `verified_badge_url` | `/api/v1/companies/:id`, `/api/v1/companies/:id/widget_data` | `WidgetBadge.tsx`, `CompanyLogo.tsx` | Não consumido | Asset visual (SVG/PNG) oficial do selo para embeds externos | Válido; múltiplos nomes legados (`image_url` vs `url`) |
| `badges` | Tabela `badges` + ActiveStorage `image` | `CompanyBadgesSerialization`, `BadgesController#badge_payload` | `/api/v1/companies/:id/badges`, `/api/v1/badges/:slug`, GraphQL `badges` (`[String]`) | `BadgesManagement.tsx`, `CompanyLogo.tsx`, `CompanyAwardsCard.tsx` (órfão) | Não consumido | Selos de conquista e reconhecimento técnico (Top Brand, etc.) | Payloads divergentes; rota pública `/badges/[slug]` dá 404 |
| `company_badges` | Tabela `company_badges` (`company_id`, `badge_id`) | Join table interno | Usado em `positioning/calculator.rb` | Indireto via `company.badges` | Nenhum | Vínculo associativo M:N de outorga de selos | `certification_progress` crasha buscando coluna `verified` inexistente |
| `featured` | `companies.featured` (bool) | `CompanySerializer`, `CompanyCardSerializer`, `CompanyListSerializer` | `/api/v1/companies`, `/api/v1/companies/:id` | `PremiumHighlightBadge.tsx` (exibe "Premium"!), `CompanyComparisonCard` | `explore.tsx`, GraphQL | Destaque editorial de distribuição | 🔴 CRITICAMENTE MAL UTILIZADO no frontend como se fosse Plano Pago |
| `sponsored` | `companies.sponsored` (bool) | `CompanySerializer`, `CompanyCardSerializer`, `Search::CompanyResultSerializer` | `/api/v1/companies`, `/api/v1/companies/search` | `CompanyIdentityLine.tsx` (`Patrocinado`) | `BannerSlot.tsx` | Placement patrocinado comercial pago | Válido, mas confundido com ranking prioritário |
| `has_paid_plan` | `Company#has_paid_plan?` (método) | `CompanySerializer`, `Search::CompanyResultSerializer` | `/api/v1/companies/:id` | `compare-company-utils.ts`, `ComparisonToggleButton` | `company/[id].tsx`, `lead.tsx` | Indicador de assinatura comercial ativa não-free | Heurísticas no front combinam `featured || has_paid_plan` |
| `plan_tier` | `Plan#inferred_plan_tier` ('free', 'pro', 'enterprise') | Serializado ad-hoc | `/api/v1/companies/:id` | `PremiumHighlightBadge.tsx` | Nenhum | Nível do pacote comercial contratado | Ausência de DTO canônico `commercial_status` |
| `plan_status` | `companies.plan_status` (string) | `CompanySerializer` | `/api/v1/companies/:id` | Comparadores usam `plan_status === 'active'` | Nenhum | Estado da assinatura no gateway (active, trial, canceled) | Deve ser encapsulado em `commercial_status` |
| `feature_access` | `CompanyFeatureAccessResolver` | `CompanySerializer#feature_access` | `/api/v1/companies/:id`, `/feature_access` | `lib/feature-access.ts`, `CompanyVerificationBadge` | `UpgradePrompt.tsx` | Mapa de entitlements de features do plano | Heurísticas na UI ignoravam entitlements e usavam `featured` |
| `highlight_badges` | Entitlement em `PlanFeatureCatalog` | `feature_access['highlight_badges']` | `/api/v1/companies/:id` | `PremiumHighlightBadge.tsx` | Nenhum | Autorização do plano para exibir reconhecimentos no perfil | Usado erroneamente para mostrar badge escrito "Premium" |
| `priority_score` | `companies.priority_score` (int) | ❌ Não serializado | Apenas ActiveAdmin | `CompanyDetailClient.tsx:512` (`score >= 100`) | Nenhum | Peso numérico interno para ordenação editorial | 🔴 INATINGÍVEL no front; torna `WinnerBadge.tsx` código morto |
| `category_info` | Helper no `CompanySerializer` | `CompanySerializer`, `Search::CompanyResultSerializer` | `/api/v1/companies/:id` | `CompanyIdentityCard.tsx` | Nenhum | Heurística legada (`categories.limit(1).first`) | Deve ser substituído por `identity.primary_category` |
| `categories` | Associação M:N `categories_companies` | `CompanySerializer#categories` | `/api/v1/companies/:id` | Catálogos, filtros, cards | `lead.tsx`, queries GraphQL | Lista de todas as áreas de atuação da empresa | Válido para filtros, proibido para identidade única (`categories[0]`) |
| `primary_category` | `companies.primary_category_id` (FK) | `CompanySerializer#identity`, `CompanyCardSerializer` | `identity.primary_category` | `CompanyIdentityCard.tsx` (link canônico) | `company/[id].tsx` | Vertical principal de identidade e posicionamento da empresa | Em implementação canônica via migration reversível |

---

## 3. Root Causes Confirmadas
1. **Confusão Semântica no Frontend:** `PremiumHighlightBadge.tsx` checava `company.featured` para exibir o texto "Premium". Uma empresa Free destacada virava "Premium".
2. **Ausência de Categoria Primária no Banco:** Apenas tabela N:N `categories_companies`. Serializers pegavam `categories.first`, que variava com a ordenação da query SQL.
3. **Endpoint `certification_progress` Quebrado:** Invocava `icon_url`, `requirements`, `badge_type` e `verified` em `company_badges` (todas inexistentes).
4. **404 na Rota de Autoridade:** O backend gerava `verifiable_url` para `/badges/:slug`, mas a rota nunca foi criada no Next.js.
5. **WinnerBadge Desconectado:** Esperava `priority_score >= 100`, mas `priority_score` nunca foi exposto pela API.
