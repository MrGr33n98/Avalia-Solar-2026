# Fase 1: Discovery, Auditoria e Proteção do Backend - Contexto

**Gathered:** 2026-05-30 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

O escopo da Fase 1 é estritamente limitado ao mapeamento detalhado da arquitetura atual, auditoria de conformidade de faturamento e Active Admin, e aprovação das premissas e riscos da refatoração da página de perfil comercial. Nenhum layout visual será modificado ou introduzido nesta fase.
</domain>

<decisions>
## Implementation Decisions

### D-01: Feature Flag de Transição
A refatoração visual será controlada no frontend Next.js por uma Feature Flag local via variável de ambiente:
`process.env.NEXT_PUBLIC_ENABLE_PREMIUM_PROFILE === 'true'`.
Isso permite isolar o desenvolvimento dos novos componentes premium em arquivos novos sem afetar a visualização dos usuários finais em produção.

### D-02: Isolamento do Backend Rails
Nenhuma linha de código produtivo no Rails backend (Stripe Checkout, faturamento, Active Admin, banco de dados ou controllers) será alterada. A API atual é robusta e fornece todos os dados necessários através da chave canonizada `feature_access` injetada pelo serializador.

### D-03: Bloqueio Estrito por Plano (Entitlements)
O frontend consumirá estritamente o helper `isFeatureEnabled(company.feature_access, 'feature_name')` para renderizar os blocos premium, garantindo que empresas do plano **Free** ou **Essential** nunca tenham acesso visual a recursos do plano **Pro** ou **Enterprise**.
- Recursos como galeria de mídia, FAQ e simulador financeiro serão estritamente ocultados se não habilitados no entitlement do cliente.

### D-04: Resiliência de Publicidade (Ads)
Todo banner patrocinado exibido nos slots responsivos (`profile_top_horizontal`, `profile_sidebar_top`) apresentará de forma clara e visível o rótulo de publicidade obrigatório (`Patrocinado` ou `Destaque Premium`). Os anúncios de concorrentes serão bloqueados automaticamente via `show_competitor_banners = false` para empresas dos planos Pro e Enterprise.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- [PlanFeatureCatalog.rb](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/models/plan_feature_catalog.rb) — Catálogo de features e overrides por plano.
- [CompanyFeatureAccessResolver.rb](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/services/company_feature_access_resolver.rb) — Mapeador dinâmico de entitlements.
- [CompanyDetailClient.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/CompanyDetailClient.tsx) — Ponto de entrada e client component master do perfil.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isFeatureEnabled` em `lib/feature-access` para checar acesso aos entitlements.
- `productsApiSafe.getByCompany(companyId)` para buscar os produtos.
- `reviewsApiSafe.getAll({ company_id })` para carregar o mural de reviews.

### Established Patterns
- Rota de slug capturando tanto slug textual quanto ID numérico na rota Next.js, mantendo SEO orgânico perfeito.
- Renderização assíncrona com Next.js Dynamic Imports para carregar componentes pesados (galeria, formulários) somente quando a aba ativa mudar.
</code_context>

<deferred>
## Deferred Ideas

- Criação de novos planos ou mudança de precificação nos checkouts do Stripe (fora do escopo da refatoração visual).
</deferred>
