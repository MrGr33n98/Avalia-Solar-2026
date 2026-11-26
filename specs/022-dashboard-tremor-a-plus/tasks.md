> V1.2: antes de implementar, cumprir `performance-engineering/00-START-HERE.md`, A0–A3 e gate D0. A extensão é vinculante para performance e ordem de execução; Tremor inspiração only permanece.

# Tasklist executável — 74 tarefas

Cada tarefa começa [ ] e exige RED quando houver comportamento testável, GREEN, refactor, evidência e commit. Baseline/descoberta usam prova observável, não teste artificial. Não marcar BLOCKED como concluída.

## W0 — Baseline e discovery (P0)

- [ ] **T001** Inventariar checkout, branches, specs e deploy SHA. **Teste/evidência:** preflight + baseline sem alterações. **Aceite:** README/AGENTS, dependências e bloqueios registrados. 
- [ ] **T002** Mapear referências visuais públicas Tremor e criar protótipo próprio com stack atual. **Teste/evidência:** matriz referência → componente próprio + diff package.json/lockfile. **Aceite:** zero instalação, fork, cópia ou dependência Tremor; apenas inspiração visual. 
- [ ] **T003** Capturar navegação autorizada de todas as rotas e aliases. **Teste/evidência:** Playwright crawl allowlist + classificação por role. **Aceite:** 121 paths classificados e links extras encontrados. 
- [ ] **T004** Inventariar tabs, subabas, ações, modais, eventos e API. **Teste/evidência:** runtime-inventory + api-parity. **Aceite:** 100% funcionalidades mapeadas ou BLOCKED explícito. 
- [ ] **T005** Baseline visual, motion, fontes e geometria. **Teste/evidência:** screenshots + computed CSS em viewports. **Aceite:** artefatos sanitizados e matrix light/dark. 
- [ ] **T006** Baseline performance e acessibilidade. **Teste/evidência:** Lighthouse/trace, axe, network cold/warm. **Aceite:** métricas e defeitos registrados. 
- [ ] **T007** Fixar testes de paridade pré-refactor. **Teste/evidência:** E2E smoke com tenants A/B. **Aceite:** RED apenas para defeitos reproduzidos. 

## W1 — Segurança, tokens e primitives (P0)

- [ ] **T008** Reproduzir race company_id e autorização admin. **Teste/evidência:** deferred selectCompany, backend IDOR. **Aceite:** sem flash, acesso indevido ou request stale. 
- [ ] **T009** Consolidar resolver de navegação/aliases. **Teste/evidência:** testes de tab, URL, back e redirects. **Aceite:** preserva deep links e flags. 
- [ ] **T010** Implementar tokens escopados dashboard. **Teste/evidência:** snapshot computed styles e marketplace. **Aceite:** não altera CSS público. 
- [ ] **T011** Padronizar Button/Input/Select/Badge/Avatar. **Teste/evidência:** RTL keyboard, contraste, variants. **Aceite:** sem novos componentes redundantes. 
- [ ] **T012** Padronizar Skeleton/Empty/Error/Locked/Offline. **Teste/evidência:** RTL estado + reduced motion. **Aceite:** zero fake data e overflow. 
- [ ] **T013** Criar guard de flag e rollback. **Teste/evidência:** tests flag off/on e default. **Aceite:** legacy preservado. 

## W2 — Shell, navegação e mobile (P0)

- [ ] **T014** Refinar EnterpriseSidebar sem duplicar menu. **Teste/evidência:** testes grupos, flyout e collapse. **Aceite:** 112/240 baseline ou mudança aprovada. 
- [ ] **T015** Refinar DashboardToolbar, busca, company switcher. **Teste/evidência:** keyboard + troca tenant. **Aceite:** foco, sem controles duplicados. 
- [ ] **T016** Unificar PageHeader, breadcrumbs e FilterBar. **Teste/evidência:** RTL e deep links. **Aceite:** ações autorizadas. 
- [ ] **T017** Mobile drawer/quick access/bottom nav. **Teste/evidência:** 320–430px, safe area, keyboard. **Aceite:** sem ações escondidas. 
- [ ] **T018** Melhorar scroll, width e skeleton shell. **Teste/evidência:** Playwright resize/zoom. **Aceite:** document scrollWidth <= clientWidth +1. 
- [ ] **T019** Aplicar motion tokens e theme. **Teste/evidência:** light/dark/presets/reduced motion. **Aceite:** sem flicker e preferência persistida. 

## W3 — Overview, analytics, charts (P0)

- [ ] **T020** Extrair MetricCard/MetricStrip e chart frame. **Teste/evidência:** teste null/0/period/unit. **Aceite:** cinco KPIs existentes preservados. 
- [ ] **T021** Refatorar overview e layout desktop/mobile. **Teste/evidência:** visual snapshots + data assertions. **Aceite:** série, fontes, oportunidades, perfil e insights. 
- [ ] **T022** Unificar período e export. **Teste/evidência:** contrato CSV, timezone, filtro. **Aceite:** mesmo período ou diferença explicitada. 
- [ ] **T023** Reutilizar Recharts com tokens e alternativa tabular. **Teste/evidência:** teclado, no data e labels. **Aceite:** legenda/tooltip acessíveis. 
- [ ] **T024** Deduplicar requests e lazy charts. **Teste/evidência:** trace before/after. **Aceite:** sem fetch duplicado evitável. 
- [ ] **T025** Refatorar analytics e benchmark existentes. **Teste/evidência:** paridade métricas e gating. **Aceite:** sem mudar cálculo. 

## W4 — Reputação, presença e catálogo (P0)

- [ ] **T026** Migrar reviews e detalhe/resposta. **Teste/evidência:** US07 + 422/403. **Aceite:** sem perda de filtros e ações. 
- [ ] **T027** Migrar coleta de avaliações e QR/embed. **Teste/evidência:** US08 com sandbox. **Aceite:** sem email real em teste. 
- [ ] **T028** Migrar widgets, confiança, selos e editor. **Teste/evidência:** preview/export e limites. **Aceite:** mesmos recursos e assets. 
- [ ] **T029** Migrar CompanyInfo, categorias e CTA. **Teste/evidência:** schema, dirty state e feature gate. **Aceite:** dados salvos e visibilidade preservados. 
- [ ] **T030** Migrar produtos e serviços. **Teste/evidência:** CRUD, status e limites. **Aceite:** sem perda de categorias e imagens. 
- [ ] **T031** Migrar projetos/materiais/formulários. **Teste/evidência:** subabas, upload, moderação. **Aceite:** PDF 25MB cliente + validação servidor. 
- [ ] **T032** Migrar mídia, perguntas e banners. **Teste/evidência:** file upload, crop e moderation. **Aceite:** sem ação inexistente inventada. 

## W5 — Intelligence (P0)

- [ ] **T033** Buyer Intent: 7 subabas, filtros, drawers. **Teste/evidência:** US14 + 403/empty. **Aceite:** gates, metodologia e dados reais. 
- [ ] **T034** Ranking: cards, evidence tabs e positioning. **Teste/evidência:** US15, períodos 30/90/365. **Aceite:** ranking sem alteração de fórmula. 
- [ ] **T035** Tracking: 7 subabas e Intent Sync. **Teste/evidência:** US16, tag, UTM, integração. **Aceite:** sem segredo em log e atribuição igual. 
- [ ] **T036** ICP e filtros segmentação. **Teste/evidência:** form schema, mobile, dirty. **Aceite:** mesmos critérios e persistência. 
- [ ] **T037** Revalidar exports/PII e planos. **Teste/evidência:** cross-tenant e downgrade. **Aceite:** nenhuma exposição privada. 

## W6 — Leads, propostas e atendimento (P0)

- [ ] **T038** Lead table/drawer e OpportunityBoard. **Teste/evidência:** US11, pagination e selection. **Aceite:** ids estáveis e ações existentes. 
- [ ] **T039** Inbox e realtime. **Teste/evidência:** US13, reconnect e switch. **Aceite:** sem envio duplicado. 
- [ ] **T040** Propostas, wizard, PDF preview e settings. **Teste/evidência:** US12, fixtures, confirmação. **Aceite:** paridade de etapas e documentos. 
- [ ] **T041** Quote form studio. **Teste/evidência:** schema e preview. **Aceite:** preserva formulários e submit. 
- [ ] **T042** Campanhas e approvals empresariais. **Teste/evidência:** sandbox + policy. **Aceite:** sem envio real, status corretos. 
- [ ] **T043** AI assistant e feature flags. **Teste/evidência:** enabled/disabled/forbidden. **Aceite:** não expor recurso não habilitado. 

## W7 — Conta, integrações e MVP (P0)

- [ ] **T044** PlanAndSubscription e pricing modal. **Teste/evidência:** US17, period, gating. **Aceite:** preços reais, sem cobrança de teste. 
- [ ] **T045** Equipe, roles, invites. **Teste/evidência:** US18, IDOR, revoke. **Aceite:** backend policy preservada. 
- [ ] **T046** Configurações, Webhooks, suporte. **Teste/evidência:** US28, ajuda e erros. **Aceite:** segredos mascarados. 
- [ ] **T047** Validação de core 15 rotas e 40 blocos. **Teste/evidência:** paridade + E2E + visual. **Aceite:** 100% classificados e aprovados. 
- [ ] **T048** Gate MVP, documentação e PR draft. **Teste/evidência:** acceptance + metrics. **Aceite:** W0–W7 concluídas ou não declarar MVP. 

## W8 — CRM Sales (P1)

- [ ] **T049** Classificar 74 rotas, role e shell CRM. **Teste/evidência:** route sweep + RBAC. **Aceite:** sem expor CRM interno ao público. 
- [ ] **T050** Today, accounts, people, companies, leads, prospects. **Teste/evidência:** data table/filters/drawers. **Aceite:** preservar CRUD e detalhes. 
- [ ] **T051** Pipeline, tasks, quotes, revenue inbox. **Teste/evidência:** keyboard/drag e optimistic rollback. **Aceite:** mesmos stages e ações. 
- [ ] **T052** Campaigns, audiences, imports, sequences, templates. **Teste/evidência:** sandbox, preview e status. **Aceite:** paridade e zero envio real. 
- [ ] **T053** Emails, WhatsApp, engagement, marketing. **Teste/evidência:** realtime, retry e errors. **Aceite:** não duplicar dispatch. 
- [ ] **T054** Reports: forecast, funnel, losses e demais. **Teste/evidência:** todas 16 rotas reports e filtros (validar contagem). **Aceite:** sem alterar métricas. 
- [ ] **T055** AI agents/activity/approvals/executions/inbox. **Teste/evidência:** RBAC, audit e confirmação. **Aceite:** human approval preservada. 
- [ ] **T056** Settings: access, custom fields, email, integrations. **Teste/evidência:** schema, secrets e permisos. **Aceite:** sem regressão de configuração. 
- [ ] **T057** Homologar 74 rotas CRM. **Teste/evidência:** E2E por jornada + smoke todas. **Aceite:** 100% classificadas. 

## W9 — Reviewer (P1)

- [ ] **T058** Auditar dois namespaces reviewer. **Teste/evidência:** redirects, role e membership. **Aceite:** 8 + 20 paths classificados. 
- [ ] **T059** Migrar overview, profile, journey, settings. **Teste/evidência:** US21/22, responsive. **Aceite:** sem cruzar dados empresa. 
- [ ] **T060** Migrar reviews, proposals, favorites, companies. **Teste/evidência:** CRUD e estados. **Aceite:** paridade de ações. 
- [ ] **T061** Migrar brands/experience/solutions/publications. **Teste/evidência:** editor e media. **Aceite:** fluxos e moderação preservados. 
- [ ] **T062** Migrar achievements, green score, rewards, notifications. **Teste/evidência:** dados reais e navegação. **Aceite:** sem gamificação inventada. 
- [ ] **T063** Homologar shell reviewer e help. **Teste/evidência:** visual/accessibility e links. **Aceite:** 100% rotas autorizadas. 

## W10 — Compatibilidade e domínio admin (P1)

- [ ] **T064** System admin DashboardLayout. **Teste/evidência:** role matrix e system metrics. **Aceite:** sem ampliar acesso. 
- [ ] **T065** Legacy company-dashboard e billing. **Teste/evidência:** redirect/plan/context. **Aceite:** links e dados preservados. 
- [ ] **T066** Select-company e requests. **Teste/evidência:** 0/1/N empresas e pending. **Aceite:** transição consistente. 
- [ ] **T067** Verificar rotas auxiliares e arquivos órfãos. **Teste/evidência:** import graph e runtime. **Aceite:** remoção só com prova e aprovação. 
- [ ] **T068** Auditar offline, notifications e theme cross-domain. **Teste/evidência:** reconnect/zoom/reduced motion. **Aceite:** todos estados críticos. 
- [ ] **T069** Documentar catálogo reutilizável e Spec 021 boundary. **Teste/evidência:** storybook/playground opcional. **Aceite:** zero runtime MCP import. 

## W11 — Release (P0)

- [ ] **T070** Executar suíte completa frontend/backend. **Teste/evidência:** Jest/Playwright/RSpec afetados. **Aceite:** sem regressão nova. 
- [ ] **T071** Gate performance, a11y e security. **Teste/evidência:** budgets, axe, IDOR. **Aceite:** evidências PASS. 
- [ ] **T072** Staging smoke e UAT. **Teste/evidência:** roles/planos/device e canary. **Aceite:** aprovação registrada. 
- [ ] **T073** Testar rollback por flag. **Teste/evidência:** desativar e reativar staging. **Aceite:** sem perder dados. 
- [ ] **T074** Entregar PRs, changelog, evidence manifest. **Teste/evidência:** review e CI. **Aceite:** sem merge/deploy sem autorização.
