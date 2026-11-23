
  de Implementação: Refatoração do Dashboard Avalia Solar

**Código do Recurso:** 017-dashboard-unslop-astryx  
**Data:** 23/11/2026  
**Documentos Relacionados:** [spec.md](./spec.md) | [plan.md](./plan.md) | [PRD](../../docs/prd/PRD_DASHBOARD_UNSLOP_ASTRYX_REFACTOR.md)

---

## Legenda de Status
- [ ] Não iniciado
- [/] Em andamento
- [x] Concluído

---

## Lista de Tarefas

### Fase 0 — Multi-Tenant, Seleção por `company_id` & TDD (P0)
- [x] **T01**: Escrever testes automatizados em Jest para seleção multi-tenant por URL (`AB0-1-front/app/dashboard/components/company-selection-multitenant.spec.tsx`).
- [x] **T02**: Estender `AB0-1-front/context/CompanyContext.tsx` com métodos `selectCompanyById` e `hasCompanyAccess`.
- [x] **T03**: Atualizar `AB0-1-front/app/dashboard/page.tsx` para sincronizar `company_id` da URL com precedência sobre o `localStorage`, aplicando proteção contra IDOR para empresas de terceiros e permissão segura para admin.
- [x] **T04**: Executar os testes da Fase 0 e verificar aprovação 100%.

### Fase 1 — Consolidação da Arquitetura & Navegação (P0/P1)
- [x] **T05**: Isolar/desativar `CompanyDashboardModern.tsx` e referências mortas.
- [x] **T06**: Unificar abas de navegação: assegurar que `info` e `product-general` conversem para a mesma visualização em `EnterpriseDashboard.tsx` e `OverviewTab.tsx`.
- [x] **T07**: Conectar funcionalidade real ao botão "Ajuda" na toolbar e no sidebar (abrir suporte/FAQ).
- [x] **T08**: Garantir consistência nas categorias do menu em `config/navigation.ts` e `EnterpriseSidebar.tsx`.

### Fase 2 — Confiabilidade de Dados & Eliminação de Mocks (P0)
- [x] **T09**: Remover dados mock estáticos de `AB0-1-front/app/dashboard/components/DashboardCharts.tsx` e implementar estado vazio elegante para gráficos sem dados.
- [x] **T10**: Atualizar o KPI "Tempo médio de resposta" em `OverviewTab.tsx` para exibir estado semântico claro ("Não configurado" / "Sem interações") com orientação de ativação.
- [x] **T11**: Criar testes automatizados para verificar a ausência de dados mock e a renderização de estados vazios (`AB0-1-front/app/dashboard/components/dashboard-charts-clean.spec.tsx`).

### Fase 3 — Refatoração Visual com Padrão Unslop & Astryx (P1)
- [x] **T12**: Redesenhar `FeatureGuard.tsx` removendo excesso de blurs, glows, gradientes e alegações hiperbólicas, aplicando estilo sóbrio orientado a benefícios.
- [x] **T13**: Refatorar o cabeçalho e os cartões de `OverviewTab.tsx` para adotar tom operacional, grade de 4px, raios concêntricos e paleta neutra com destaque solar calmo.
- [x] **T14**: Suavizar a paleta de cores dos gráficos em `OverviewTab.tsx` para evitar concorrência cromática.

### Fase 4 — Acessibilidade, Qualidade de Código & Verificação Final (P1)
- [x] **T15**: Adicionar `aria-label` e `title` a botões de ícone sem texto acessível no dashboard.
- [x] **T16**: Adicionar alternativas tabulares acessíveis (`<table>` estruturada) para os gráficos de métricas.
- [x] **T17**: Corrigir erro de ESLint em `CompanyAiStudio.tsx` substituindo `<img>` por componente otimizado `<Image />` do `next/image` ou SVG.
- [x] **T18**: Executar verificação completa com ESLint (`npx eslint`), TypeCheck e suíte Jest (`npm test`).
