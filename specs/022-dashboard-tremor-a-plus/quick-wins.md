# Quick wins — ordem e hipótese
| Prioridade | Intervenção | Evidência/risco | Aceite |
| --- | --- | --- | --- |
| P0 | Baseline e mapa de navegação | Spec 017 + aliases e 40 tabs | Matriz de destinos/roles completa; nenhum link órfão |
| P0 | Tenant-safe loading | page.tsx chama void selectCompany e depois company_admin; effectiveCompanyId prefere activeCompany | Teste atraso A/B e admin não associado; sem flash ou query errada |
| P0 | Tokens escopados | globals + classes slate/white/rounded | Light/dark visual, sem afetar PWA |
| P0 | PageHeader / FilterBar / KPI | OverviewTab possui layouts específicos | Extrair sem mudar dados; preservar CSV |
| P0 | Estados sem mock | Spec 017 exige; testar runtime | Null/zero/forbidden/error distintos |
| P1 | Ajustar skeleton geometria | Skeleton fixo 250/400px e rail | 320px sem overflow; CLS ≤0.1 |
| P1 | Sidebar e toolbar compactas | 112/240 rail, mobile sheet e 2 linhas | Acesso teclado e safe area; sem duplicar |
| P1 | Tabela e drawer reutilizáveis | CRM/lead/catalog múltiplas telas | Seleção por ID; filtro URL e actions |
| P1 | Motion reduzido | transition-all, pulse e motion.aside | Reduced-motion sem animação desnecessária |
| P1 | Lazy charts e tab data | Recharts e queries existentes | Comparação de bundle e requests; sem regressão |
| P1 | Gating consistente | FeatureGuard e plan access | Matriz role/plano; backend 403 preservado |
| P2 | Catálogo interno visual | Spec 021 em paralelo | Não importar MCP runtime, documentar tokens |
