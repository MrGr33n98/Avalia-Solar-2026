# Matriz de Testes & Casos Críticos — Spec 005

## 1. Casos Críticos de Semântica e Ortogonalidade

| Caso | Entrada | Comportamento Esperado | Status |
|---|---|---|---|
| **C1: Destaque Free** | `featured = true`, `plan_tier = 'free'` | Exibe "Destaque" onde couber; **NÃO** exibe badge PRO/Premium. | Planejado |
| **C2: Plano Pago Sem Destaque** | `featured = false`, `plan_tier = 'pro'` | Exibe badge comercial `PRO`; não exibe Destaque. | Planejado |
| **C3: Pago Não Verificado** | `verified = false`, `plan_tier = 'pro'` | Exibe badge `PRO`; **NÃO** exibe ícone de verificação `BadgeCheck`. | Planejado |
| **C4: Free Verificado** | `verified = true`, `plan_tier = 'free'` | Exibe ícone oficial de verificação; **NÃO** exibe badge PRO. | Planejado |
| **C5: Free com Badge de Reconhecimento** | `plan_tier = 'free'`, possui `Badge` ativo | Exibe medalha conquistada na seção de reconhecimentos normalmente. | Planejado |
| **C6: Categoria Primária Válida** | `primary_category_id = 70` (presente em `categories`) | Serializa `{ id: 70, name: "...", slug: "..." }`; link navega para `/categories/slug`. | Planejado |
| **C7: Categoria Primária Inválida** | `primary_category_id = 999` (não pertence à empresa) | Validação ActiveRecord falha com erro de validação. | Planejado |
| **C8: Categoria Primária Legada (Null)** | `primary_category_id = NULL` | Serializa `primary_category: null`; UI não exibe badge e **NÃO** faz fallback para `categories[0]`. | Planejado |
| **C9: Badge Inativo / Inexistente** | `public_slug` inválido ou `active = false` | Endpoint `/badges/:slug` e página Next.js retornam **HTTP 404 real**. | Planejado |
| **C10: Dashboard Progress** | Empresa com badges e badges disponíveis | Retorna `earned_badges` e `available_badges` com status 200 (sem silent rescue). | Planejado |

---

## 2. Testes por Camada

### 2.1 Backend (RSpec)
- `spec/models/company_spec.rb`: Validações de `primary_category_id`.
- `spec/models/badge_spec.rb`: Validação de unicidade de `public_slug`, anexo de imagem, escopo `active`.
- `spec/serializers/company_serializer_spec.rb`: Serialização de `identity`, `commercial_status`, `recognitions`.
- `spec/requests/api/v1/badges_spec.rb`: `GET /api/v1/badges/:slug` e `GET /api/v1/companies/:id/badges`.
- `spec/requests/api/v1/company_dashboard/certification_progress_spec.rb`: Payload correto de progresso.

### 2.2 Frontend (Jest & React Testing Library)
- `CompanyIdentityCard.test.tsx`: Renderização do `PrimaryCategoryBadge` e `VerificationBadge`.
- `CommercialPlanBadge.test.tsx`: Exibição de `PRO` e `ENTERPRISE`; vazio para `free`.
- `CompanyAwardsCard.test.tsx`: Renderização de badges e abertura de modal Dialog.
- `app/badges/[slug]/page.test.tsx`: Renderização de metadados, selo oficial e lista de empresas outorgadas.

### 2.3 E2E (Playwright)
- Fluxo completo: Home ➔ Perfil da Empresa ➔ Visualização do Selo ➔ Clique no Selo ➔ Redirecionamento para `/badges/:slug` ➔ Comprovação de autenticidade ➔ Clique na empresa ➔ Retorno ao perfil.
