# Catálogo proprietário (60 componentes planejados)
Status: E = equivalente existente; X = extrair/evoluir; N = novo proposto; D = diferido. Nomes públicos de registry são kebab-case. Não renomear exports existentes sem alias e teste.
## Primitives
| Componente | Status | Wave | Origem ou objetivo |
|---|---|---|---|
| ASButton | E/X | W2 | Button |
| ASIconButton | N | W2 | ação compacta |
| ASAvatar | E/X | W2 | LogoAvatar |
| ASBadge | E/X | W2 | VerificationBadge |
| ASCard | E/X | W2 | as-card |
| ASTypography | N | W2 | classes de título/meta |
| ASInput | E/X | W2 | input existente |
| ASSelect | E/X | W2 | Select |
| ASCheckbox | E/X | W2 | Checkbox |
| ASTabs | N | W2 | navegação acessível |
| ASDivider | E/X | W2 | separação |
| ASSkeleton | E/X | W2 | SkeletonList |
| ASEmptyState | E/X | W2 | EmptyState |
| ASErrorState | E/X | W2 | ErrorState |
| ASTooltip | N | W2 | contexto acessível |
## Marketplace
| Componente | Status | Wave | Origem ou objetivo |
|---|---|---|---|
| SolarCompanyCard | X | W3 | IntegratorCard |
| SolarCompanyList | X | W3 | SearchWidget |
| SolarCompanyGrid | N | W3 | Product List grid |
| SolarCompanyCarousel | N | W4 | Product List carousel |
| CompanyComparisonPicker | X | W5 | SearchWidget selection |
| CompanyComparisonTable | X | W5 | CompareView |
| GeographicFilter | X | W3 | SearchWidget |
| CategorySelector | X | W3 | CategoriesWidget |
| CategoryGrid | X | W3 | CategoriesWidget |
| SolarIntegratorMap | D | W8 | map-carousel |
| SolarQuickActions | X | W3 | quick-reply |
| CompanyShortlist | D | W8 | selection local, sem persistência não autorizada |
## Brand Page
| Componente | Status | Wave | Origem ou objetivo |
|---|---|---|---|
| BrandHero | E | W4 | BrandHero |
| BrandIdentity | X | W4 | ProfileView |
| BrandMetrics | X | W4 | ProfileView |
| BrandOverview | X | W4 | BrandSections |
| BrandServices | X | W4 | CatalogPreview |
| SolarProductCard | X | W4 | CatalogPreview |
| SolarProductList | X | W4 | CatalogPreview |
| ProductGallery | X | W4 | CatalogPreview |
| ProductSpecifications | D | W8 | contrato futuro |
| ProjectPortfolio | E | W4 | ProjectPortfolioPreview |
| ProjectGallery | E | W4 | PublicMediaGallery |
| BrandVideoGallery | D | W8 | mídia autorizada |
| BrandFAQ | D | W8 | contrato futuro |
## Trust
| Componente | Status | Wave | Origem ou objetivo |
|---|---|---|---|
| VerifiedBadge | E | W2 | VerificationBadge |
| ReputationBadge | X | W6 | RatingInline |
| AchievementBadge | D | W8 | dados autorizados |
| ReviewCard | D | W8 | contrato de avaliações individuais |
| CompanyReviewList | D | W8 | paginação/moderação |
| ReviewDistribution | X | W6 | ReputationView |
| ReputationTimeline | D | W10 | snapshot histórico |
| TrustScoreCard | D | W10 | metodologia homologada |
| EvidenceCard | X | W6 | SourceNote |
| RankingCard | D | W10 | ranking real e metodologia |
## Conversão e inteligência
| Componente | Status | Wave | Origem ou objetivo |
|---|---|---|---|
| QuoteRequestForm | D | W9 | contact-form |
| QuoteRequestConfirmation | D | W9 | order-confirm |
| QuoteProgress | D | W9 | progress-steps |
| EnergyBillInput | D | W9 | amount-input |
| TechnicalVisitScheduler | D | W10 | date-time-picker |
| BuyerIntentChart | D | W10 | privado |
| BenchmarkTable | D | W10 | privado |
| AnalyticsStatCard | D | W10 | privado |
| ConversionFunnel | D | W10 | privado |
| BrandHealthCard | D | W10 | privado |

O catálogo é uma visão de produto, não uma promessa de 60 implementações no MVP. Primitives existentes devem ser reutilizadas; componentes sem dados/consumidores reais podem permanecer documentados como backlog. Por item, produzir README de props, estados, tokens, acessibilidade, dependências, teste, exemplo sintético e matriz de hosts. Classificar status implementado/testado/deferido.
