# CURRENT PAGE MAP — Mapeamento do Codebase Atual

Abaixo está o inventário técnico mapeado de todos os arquivos envolvidos no funcionamento do Perfil de Empresa da plataforma Avalia Solar.

## 1. Frontend (Next.js - AB0-1-front)

### 1.1 Rotas e Páginas Principais
- [id]/page.tsx: Arquivo que captura o ID ou slug do perfil público da empresa, efetua o fetch de SEO no servidor e renderiza o Client Component principal.
  - Path: `AB0-1-front/app/companies/[id]/page.tsx`
- CompanyDetailClient.tsx: Client Component master que gerencia abas, estados globais de dados, filtros locais e integrações analíticas.
  - Path: `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`

### 1.2 Componentes Legados (AB0-1-front/app/companies/[id]/components)
- `CompanyHero.tsx`: Renderiza a imagem de cobertura, logo e informações chaves do topo.
- `CompanySidebar.tsx`: Painel lateral contendo botões de contato, WhatsApp e links institucionais.
- `CompanyOverview.tsx`: Aba padrão de visualização geral com descrição curta da empresa.
- `CompanyProducts.tsx`: Exibição da listagem de soluções.
- `CompanyReviews.tsx`: Renderizador básico do mural de reviews.
- `CompanyFinancing.tsx`: Bloco integrado para simulação de parcelas e linhas de crédito.
- `FaqSection.tsx`: Sanfona de FAQ.
- `SocialProof.tsx`: Widget de prova social destacando satisfação de clientes.
- `SponsoredBanner.tsx`: Componente para banners do plano pago.
- `StickyCTA.tsx`: Botão flutuante para conversão em mobile.

---

## 2. Backend (Ruby on Rails - AB0-1-back)

### 2.1 Modelos de Dados
- `Company`: Modelo principal contendo validações de CNPJ, estados/cidades do Brasil (Locations::BrLocations), lógica de ranking, etc.
  - Path: `AB0-1-back/app/models/company.rb`
- `Plan`: Define o plano ao qual a empresa está assinada, integrando IDs de preços do Stripe.
  - Path: `AB0-1-back/app/models/plan.rb`
- `PlanFeatureCatalog`: Catálogo centralizado que mapeia os overrides de features e entitlements.
  - Path: `AB0-1-back/app/models/plan_feature_catalog.rb`
- `Review`: Tabela de avaliações, pontuações de critérios e moderação administrativa.
  - Path: `AB0-1-back/app/models/review.rb`

### 2.2 Controladores e Serializadores (API v1)
- `CompaniesController`: Expõe endpoints `/api/v1/companies/:id`, `/api/v1/companies/by_slug/:slug`, e sub-recursos de analytics, feature_access e social_proof.
  - Path: `AB0-1-back/app/controllers/api/v1/companies_controller.rb`
- `CompanySerializer`: Serializador padrão que monta o payload de dados lidos pelo Next.js.
  - Path: `AB0-1-back/app/serializers/company_serializer.rb`
- `CompanyFeatureAccessResolver`: Classe de serviço que traduz e funde os entitlements de planos para o payload da empresa.
  - Path: `AB0-1-back/app/services/company_feature_access_resolver.rb`
