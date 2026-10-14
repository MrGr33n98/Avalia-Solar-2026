# Auditoria de Upgrade de Planos e Modal — Avalia Solar 2026

## 1. Identificação do Ambiente e Governança

- **Raiz do repositório:** `/home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026`
- **Branch:** `main`
- **Último commit:** `2cf30b52` (`feat(company-profile): refactor header density and cta layout`)
- **Status Git:** Limpo (apenas arquivos descompactados em `AB0-1-front/public/avalia-solar-upgrade-assets/`)
- **Frontend:** Next.js 14.2.34 (App Router), React 18.2.0, TypeScript 5.2.2, Tailwind CSS 3.3.0, Radix UI
- **Backend:** Ruby 3.2.2, Rails 7.0.8, PostgreSQL 14+, Redis 7, Puma 5
- **Contêineres ativos:** `ab0-frontend` (:3000), `ab0-backend` (:3001), `ab0-postgres` (:5432), `ab0-redis` (:6379)

---

## 2. Inventário de Arquivos do Pacote de Entrada

Diretório: `AB0-1-front/public/avalia-solar-upgrade-assets/`

1. `assets/lock-sparkles.svg`: 64×64 SVG escalável, círculo `#FBBF24`, cadeado branco com contorno preto e estrelas de brilho. Auditado: sem `<script>`, sem links externos, sem entidades remotas.
2. `assets/arrow-up-right.svg`: 24×24 SVG escalável, ícone de seta externa em `#6366F1`. Auditado: limpo.
3. `assets/crown-highlight.svg`: 24×24 SVG escalável, coroa em `#D69E00`. Auditado: limpo.
4. `assets/feature-check.svg`: 24×24 SVG escalável, círculo e checkmark em `#2563EB`. Auditado: limpo.
5. `assets/feature-unavailable.svg`: 24×24 SVG escalável, círculo e traço em `#94A3B8`. Auditado: limpo.
6. `assets/sparkles.svg`: 24×24 SVG escalável, brilhos dourados em `#FBBF24`. Auditado: limpo.
7. `components/SidebarUpgradeWidget.tsx`: Apresentação simples de botão com texto "Desbloqueie seu potencial" e link "Conhecer planos".
8. `components/PlansPricingModal.tsx`: Componente de apresentação de modal baseado em Radix Dialog.
9. `docs/SPEC.md`: Especificação com tokens, diretrizes de contraste, regras de negócio e critérios de aceitação.

---

## 3. Mapeamento dos Componentes Existentes e Pontos de Integração

### 3.1 Sidebar e Dashboard
- `AB0-1-front/app/dashboard/page.tsx`: Entrypoint da rota `/dashboard`.
- `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`:
  - Componente controlador de estado do dashboard empresarial.
  - Instancia `EnterpriseSidebar` (L459-467).
  - Gerencia `activeTab` (`overview`, `product-pricing`, etc.) e `companyId`.
  - Captura retorno de checkout com sucesso via URL query `checkout=success` (L376-397).
- `AB0-1-front/app/dashboard/components/EnterpriseSidebar.tsx`:
  - Sidebar em desktop (240px expandido / 112px rail compacto) e mobile drawer (`Sheet`).
  - Topo: `BrandLogo` e `CompanyPlanBadge` (L309-322).
  - Rodapé (L341-414): `settingsItem`, `Alternar Empresa` e `Sair`.
  - **Ponto de inserção do widget:** Entre `settingsItem` e `Alternar Empresa`, preservando espaçamento e sem colisão de scroll.

### 3.2 Aba Plano e Assinatura
- `AB0-1-front/app/dashboard/components/PlanAndSubscription.tsx`:
  - Consome `/api/v1/company_dashboard/subscription?company_id=${companyId}`.
  - Exibe plano ativo, limites e quotas de uso.
  - Linha 106 possui `<Button>Fazer Upgrade de Plano</Button>` sem `onClick`.
  - **Ponto de integração:** Acoplar o mesmo handler `onOpenPlans` do dashboard ao botão.

### 3.3 Catálogo de Preços e APIs
- `AB0-1-front/lib/pricing/billing.ts`:
  - Define `pricingByPlan`:
    - `essential`: 12 meses R$ 590 (equivalente a R$ 49,17/mês)
    - `pro`: 12 meses R$ 1.500 (equivalente a R$ 125,00/mês)
- `AB0-1-front/lib/pricing/catalog.ts`:
  - Contém `pricingPlans` com metadados dos 4 planos (`free`, `essential`, `pro`, `enterprise`).
- `AB0-1-front/lib/api/billing.ts`:
  - `billingApi.getPlans()`: Busca `/api/v1/billing/plans`.
  - `billingApi.createCheckoutSession(companyId, planId, ...)`: Cria sessão de checkout com `Idempotency-Key`.
  - `billingApi.createEnterpriseLead(companyId, planId, ...)`: Cria lead para contato comercial Enterprise.

### 3.4 Backend e Entitlements
- `AB0-1-back/app/models/plan_feature_catalog.rb`:
  - Catálogo de tiers (`free`, `essential`, `pro`, `enterprise`) e matriz de permissões (`TIER_DEFAULT_OVERRIDES`).
  - `custom_ctas` (botão de orçamento) é desativado para Free e ativado para planos pagos.
- `AB0-1-back/app/services/lead_wizard/creator.rb`:
  - Valida se `preferred_company.has_paid_plan?` antes de permitir lead direto para a empresa.
- `AB0-1-front/components/company/CompanyCTAGroup.tsx`:
  - Exibe "Solicitar orçamento" apenas para empresas com plano pago (`hasPaidPlan`), mantendo "Comparar" e "Avaliar empresa" para Free.

---

## 4. Auditoria de Estados

1. **Free:** Exibe widget na sidebar com destaque visual. Clicar abre o modal de planos.
2. **Essencial / Pro:** Exibe widget direcionando para o próximo tier (ou Enterprise).
3. **Enterprise:** Oculta o widget na sidebar, pois a empresa já possui todos os recursos liberados.
4. **Sem permissão (membro não-administrador):** Widget pode ser visualizado, mas botão de checkout avisa que a alteração de plano deve ser feita por um administrador.
5. **Erro de rede:** Feedback visual gracioso sem quebra de página.
