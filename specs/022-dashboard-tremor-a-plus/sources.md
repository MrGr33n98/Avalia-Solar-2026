# Fontes e limites
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/page.tsx — resolução de role/tenant, modo system_admin e company_admin, redirecionamentos.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/layout.tsx — ApolloProviderWrapper e OfflineStatusBar.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx — TabsContent, lazy loading, guards, shell.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/config/navigation.ts — menu 8 grupos; flags e contextos.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/components/EnterpriseSidebar.tsx — rail, sheet mobile, company selector, motion.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/components/DashboardToolbar.tsx — company switcher, command menu, ajuda, perfil, theme.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/components/OverviewTab.tsx — KPIs, queries e seções.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/hooks/useCompanyDashboardData.ts — company, stats, feature access, notifications e subscription.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/globals.css — tokens dashboard e temas; https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/tailwind.config.ts — breakpoint 1180px.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/package.json — Next 14.2.35, React 18.2, Tailwind 3.3.3, Recharts 2.12.7, Radix, Framer Motion, Jest, Playwright, Axe.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/specs/017-dashboard-unslop-astryx/spec.md e plan.md — requisitos predecessores, não comprovação de resolução em produção.
- https://github.com/MrGr33n98/Avalia-Solar-2026/blob/main/AB0-1-front/app/dashboard/components/intent/BuyerIntentWorkspace.tsx; tracking/TrackingAttributionWorkspace.tsx; RankingPerformanceTab.tsx; ProjectsMaterialsHub.tsx; ProductsManagement.tsx — subabas e workflows parcialmente inspecionados.
- https://blocks.tremor.so/templates#template-database — Database marketing, Dashboard/Insights apps; Overview/Planner analytics.
- https://blocks.tremor.so/blocks — famílias de blocos; https://blocks.tremor.so/getting-started — instalação para Blocks; https://www.tremor.so/docs/getting-started/installation — Raw atual requer Tailwind 4; https://github.com/tremorlabs/tremor — Apache-2.0 para biblioteca, não para template comercial.
- URL alvo https://app.avaliasolar.com.br/dashboard?company_id=372: acesso web falhou; sessão autenticada, DOM, screenshots, APIs e CSS computado não verificados.

Árvore Git retornada sem truncamento, tree SHA 3a823f41068649b8de92565bf471794f2436261a. Rotas inventariadas por filename; aliases/flags e acesso real devem ser verificados. Não foram lidos todos os arquivos de todas as 121 rotas. Não confundir inventário estático de caminhos com auditoria visual executada. Toda métrica proposta precisa de baseline.

Rev. 1.1: referências de instalação/licenciamento acima são contexto de pesquisa histórica, não instruções de execução; somente observar demos/documentação públicas Tremor. Spec 017 é baseline funcional, não referência estética concorrente.
