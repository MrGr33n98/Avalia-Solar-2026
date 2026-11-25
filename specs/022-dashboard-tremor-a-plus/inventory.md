# Inventário estático e diagnóstico por nível
## N0 — fronteira e runtime
DashboardRootLayout: ApolloProviderWrapper, OfflineStatusBar e shell raiz. DashboardPageContent usa AuthContext, CompanyContext, search params, router, React Query; escolhe system_admin / company_admin / redirects. EnterpriseDashboard é shell empresarial; DashboardLayout permanece para system admin. Legacy company-dashboard redireciona para /dashboard. Não consolidar roles diferentes em uma permissão comum.

## N1 — shell e navegação observados
- EnterpriseSidebar: rail 112px em viewport intermediário e 240px a partir do breakpoint dashboard (1180px), mobile 0px com Sheet até 320px; logo, nav em árvore, grupos expansíveis, flyout, badges, upgrade, troca empresa, logout; motion.aside e transições de 200ms. Confirmar larguras reais e estado colapsado no browser.
- DashboardToolbar: linha min-h-14, segunda linha móvel min-h-12, logo mobile, CompanySwitcher, CommandMenu, Ajuda, avatar/menu, configurações e tema; ações rápidas de coleta. Verificar duplicidade e focus.
- EnterpriseDashboard: max-width 1400px; padding escalonado p-2/sm:p-4/md:p-5/dashboard:p-6; main com safe area, tabs controladas por URL, skeletons e guard; transição de padding 200ms e cores 300ms. Layout não prova medidas computadas.
- MobileDashboardQuickAccess, MobileBottomNavigation (arquivo existe; montagem efetiva a validar): atalhos, badges, safe area; nav inferior de cinco posições definida no código, não afirmar ativa sem runtime.
- DashboardNavigationFlyout, CommandMenu, ThemeToggle, CompanyPlanBadge, SidebarUpgradeWidget, PlansPricingModal, FeatureGuard, ApprovalsPanel.

## N2 — visão geral, dados e interações
OverviewTab: saudação, período, export CSV, KPIs Visualizações do perfil, Interações (CTAs), Leads, Taxa de conversão, Tempo médio de resposta; série temporal, fontes rastreadas, oportunidades recentes, status do perfil, próximas ações, insights de intenção. Grid desktop de 5 métricas e coluna auxiliar 310px em xl; cards arredondados 2xl, padding 16/20px; charts com alternativa tabular em trechos observados. Queries overview-analytics, overview-series (período), overview-campaigns, overview-recent-leads, overview-intent (gated), chaves companyId. Testar se métricas/CSV usam mesmo período. Não assumir 5 queries como total de requests.

## N3 — módulos e subabas observados
- BuyerIntentWorkspace: overview, profile_signals, signals, comparisons, segments, alerts, method. Funil Descoberta/Consideração/Decisão. IcpFilterPanel, BuyerIntentTable, AccountDetailDrawer, ProfileSignalsTab, BuyerIntentReporting.
- TrackingAttributionWorkspace: overview, journey, visitors, installation, integrations, settings, utm_builder; Intent Sync, TrackingHealth, UTM builder, ProspectJourneyDrawer, attribution explorer.
- RankingPerformanceTab: períodos 30/90/365, filtros e URL, estado API e metodologia; RankingExecutiveHero, RankingCards, RankingBenchmarkCards, RankingContextChips, RankingEvidence, RankingEvidenceTabs, RankingGovernanceStrip, RankingPositioningMap, PositioningCompanyInspector, RankingMethodologyDialog, RankingMethodologyFormula, RankingMethodologyTransparency, RankingStateBanner, RankingWhyCard. Componentes listados na árvore; validar montagem.
- ProjectsMaterialsHub: projects/materials/forms/analytics/leads; criar, editar, submissão para moderação, upload, arquivar/restaurar, mídias e formulário; PDF até 25 MB validado no cliente; servidor continua soberano.
- ProductsManagement: estados publicado, rascunho, arquivado, desativado; preservar edição, publicação, categorias, serviços e limites.
- Propostas: CompanyMarketplaceProposalsWorkspace, LeadDetailsDrawer, ProposalConversationPane, ProposalDetailsPane, ProposalFiltersDrawer, ProposalListPane, ProposalReadonlyPreview, ProposalSettingsStudio, ProposalSuccessScreen, ProposalWizardEditor, SelectEligibleLeadDialog, PdfModelChooserDrawer, PdfPreviewModal, SectionEditorDrawer, SettingsSidebarNav (presença por árvore).
- Reputação: ReviewsManagement, ReviewsAnalytics, ReviewDetailPanel, ReviewFormsManagement, ReviewCollectionHub, ReviewCollectionAnalytics, RequestReviewEmailDrawer, ReviewShareCard, ReviewButtonEmbed, ReputationMilestones; widgets, confiança e selos. Validar ações reais de resposta, envio e embed.
- Perfil: CompanyInfo, CategoriesManagement, ProductsManagement, ServicesManagement, MediaGallery, ProjectsMaterialsHub, BrandHeroCarouselManager, SectorQuestionsManager, BrandPageCTAVisibility, CtaVisibilitySettings, ConversionSurfacesOverview.
- Comercial: LeadsOpportunities, OpportunityBoard, LeadIntelligenceSheet, SellerInformationPanel, CampaignsMarketing, TopCampaignsCard, WebhooksManagement, PlanAndSubscription, TeamManagementWorkspace, IcpSetupForm, ApprovalsPanel.
- Primitivas/charts: StatsCard, ChartCard, MetricCard, RealtimeKPICard, DashboardCharts, TimeSeriesChart, CTABreakdownChart, MagicQuadrant, DataTable, RecentActivity, DateRangePicker, ExportButton.

## N4 — domínios adicionais
CRM Sales: 74 page.tsx; Reviewer /dashboard/reviewer: 8; /review-dashboard: 20. Veja inventory-routes.csv; conteúdo de cada página ainda não auditado. Validar domínio/host, roles, layout, rotas duplicadas e quais de fato pertencem ao app. /company-dashboard e /select-company têm 2 rotas cada. Core /dashboard sem sales/reviewer tem 15 rotas. Nenhum arquivo deve ser removido só por parecer legado.

## N5 — infraestrutura, estados e auditoria obrigatória
useCompanyDashboardData: leitura company, stats, feature access, notifications, subscription realtime. Contexto e chaves tenant-aware; revisar race, cleanup, invalidation e autorização servidor. Verificar 401/403/404/409/422/429/5xx, pending membership, offline/reconnect, empty vs zero vs unavailable, skeleton, partial error, retry, stale data, pagination, form dirty, upload progress, locked plan, keyboard/focus, dark e zoom. Capturar DOM/A11y tree, estilos computados, traces, vídeo, HAR sanitizado, mapa de componentes/props, network e screenshots; não foi possível executar aqui. Templates/runtime-inventory.csv é o formato de fechamento.
