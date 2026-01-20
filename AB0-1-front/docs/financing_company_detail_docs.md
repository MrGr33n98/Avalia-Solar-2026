# Redesign técnico: CompanyFinancing e CompanyDetailClient

## Objetivos
- UX premium com shadcn-ui
- Sincronização com APIs reais (financing_options, financing_proposals, analytics)
- Performance, acessibilidade (WCAG 2.1 AA) e mobile-first
- Componentização alinhada ao MCP Context7

## Arquitetura de Fluxo
- Simulação: CompanyFinancing chama `financingOptionsApi.simulate` com debounce; atualiza `simulationResult`
- Seleção e envio: usuário escolhe opção, valida contato (zod), envia via `financingProposalsApi.submit`; Context7 persiste `proposalId` e `status`
- Status em tempo real: polling de `financingProposalsApi.status`; UI atualiza em CompanyFinancing (passo 3)
- Analytics: eventos rastreados via `analyticsApi.trackEvent` (simulate, select_best, click_interest)

## Componentes e UI
- CompanyFinancing
  - Wizard em 3 passos (Simulação, Opções, Concluído)
  - Filtros e visualização:
    - Ordenação por métrica (parcela, custo total, taxa)
    - Filtro por instituição
    - Tabs: Cards, Tabela, Gráfico
    - Gráficos (recharts): linha (parcela/custo) e barras (taxas/CET)
  - Acessibilidade:
    - labels, aria-busy em envio, foco e contraste via shadcn-ui
  - Responsivo:
    - Grid adaptativo (1–3 colunas), controles empilhados em mobile
  - Context7:
    - `useFinancingContext7` para `proposal_submitting/submitted/failed` e `status_updated`

- CompanyDetailClient
  - Tabs: overview, products, reviews, financing, gallery, stats, details, edit
  - Stats:
    - Cards com claims e métricas públicas
    - Gráfico em tempo real (views/clicks/leads) usando `historicalData` (recharts)
  - Detalhes (hierarquia):
    - Accordion com Perfil, Contato, Capacidades
    - Usa `currentCompany` e `analyticsSettings`

## Integrações Backend
- Rotas:
  - `GET /api/v1/companies/:id/financing_options/simulate`
  - `GET /api/v1/companies/:id/financing_options` (pre-warm)
  - `POST /api/v1/companies/:id/financing_proposals`
  - `GET /api/v1/companies/:id/financing_proposals/:proposal_id/status`
  - Analytics: `GET /review_analytics`, `GET /traffic_sources`, `GET /historical_data`, `GET /analytics_settings`

## Performance
- Debounce de simulação (450ms)
- `useMemo` para derivados (institutions, filteredOptions, chartData)
- Renderização condicional (skeletons e tabs)
- Sessão: cache de `products` e `reviews`

## Acessibilidade
- Estados de carregamento e erro evidentes
- Semântica com roles e labels
- Contraste e foco via design system

## Estilo e Consistência
- shadcn-ui: Card, Tabs, Select, Switch, Table, Accordion
- Ícones lucide, utilitário `cn`, escalas e tokens existentes

## Pontos de Extensão
- Conectar CTA “Falar com especialista” ao WhatsApp/CRM
- Adicionar export CSV/PDF das opções selecionadas
- Habilitar `use_type` na simulação quando existir no backend

