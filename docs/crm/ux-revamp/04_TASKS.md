# 04 — Work Breakdown Structure (WBS & Tarefas de Execução)

## 1. Convenção de Estados
- `PASS`: Tarefa implementada, testada e validada com evidência.
- `IN_PROGRESS`: Em desenvolvimento ativo.
- `PLANNED`: Planejada na sequência de prioridades.
- `BLOCKED`: Bloqueada por dependência externa (provedor, credencial ou decisão de arquitetura).
- `DEFERRED`: Postergada por não ser prioritária no escopo core.

---

## 2. Tabela de Tarefas por Sprint

### Sprint 0 — Inventário, Baseline & Auditoria (READ-ONLY)
| TASK_ID | GAP_ID | USER_STORY | DEPENDS_ON | FILES | ACTION | ACCEPTANCE CRITERIA | TEST | STATUS |
|---------|--------|------------|------------|-------|--------|---------------------|------|--------|
| **T-000** | GAP-00 | US-CRM-001 | Nenhuma | Repositório | Auditar branch/HEAD, status do git, regras e estrutura | Working tree limpo, HEAD identificado | `git status`, `git rev-parse HEAD` | **PASS** |
| **T-001** | GAP-00 | US-CRM-001 | T-000 | `docs/0.0.0.1-crm-nutshell/*` | Cruzar as 14 referências pedagógicas, checar claims E0/E1 | Decisões adotar/adaptar/rejeitar documentadas | Leitura analítica | **PASS** |
| **T-002** | GAP-00 | US-CRM-001 | T-000 | `routes.rb`, `app/dashboard/sales/**` | Inventário de rotas REST Rails e páginas App Router | 100% das rotas e controllers mapeados | `grep routes.rb`, `find page.tsx` | **PASS** |
| **T-003** | GAP-03 | US-CRM-002 | T-000 | `components/sales/layout/*` | Inventário UI: Shell, Sidebar, Topbar, Modais | Mapeamento de concorrência e breakpoints | Inspeção estática de código | **PASS** |
| **T-004** | GAP-00 | US-CRM-003 | T-000 | `tailwind.config.ts`, `globals.css` | Validação de tokens de design oficiais Avalia Solar | Zero fontes/cores proprietárias externas | `view_file` | **PASS** |
| **T-005** | GAP-00 | US-CRM-004 | T-000 | `AB0-1-front` | Baseline de TypeScript e suites de teste Jest | Zero erros de tipo no build | `npm run typecheck`, `npx jest` | **PASS** |
| **T-006** | GAP-00 | US-CRM-004 | T-001 | `docs/crm/ux-revamp/*` | Produzir matriz de gaps, decisões e governança | 16 documentos gerados com rastreabilidade | Inspeção de arquivos gerados | **PASS** |

### Sprint 1 — Segurança, Persistência & Consistência (P0)
| TASK_ID | GAP_ID | USER_STORY | DEPENDS_ON | FILES | ACTION | ACCEPTANCE CRITERIA | TEST | STATUS |
|---------|--------|------------|------------|-------|--------|---------------------|------|--------|
| **T-010** | GAP-01 | US-CRM-021 | T-005 | `components/sales/CallLoggerModal.tsx` | Corrigir falso sucesso, validar `res.ok`, receipt id e exigir `accountId` | Erro HTTP não fecha modal; notas preservadas; bloqueio sem conta | `CallLoggerModal.test.tsx` | **IN_PROGRESS** |
| **T-011** | GAP-02 | US-CRM-022 | T-002 | `CreateActivityModal.tsx`, `ActivitiesController.rb`, `routes.rb` | Permitir `sales_account_id` e rota direta `/activities` | Salva atividade com 201 Created e invalida cache | Jest test + controller check | **IN_PROGRESS** |
| **T-012** | GAP-05 | US-CRM-038 | T-005 | `lib/api/sales/client.ts` | Consolidar Map TTL e padronizar SalesApiError | Zero erros silenciosos; códigos unificados | Jest unit test | **IN_PROGRESS** |
| **T-013** | GAP-05 | US-CRM-038 | T-012 | `lib/api/sales/queries.ts`, `queryKeys.ts` | Padronizar queryKeys e invalidação após mutações | Timeline e Hoje atualizados após ações | TypeScript check | **IN_PROGRESS** |
| **T-014** | GAP-04 | US-CRM-024 | T-002 | `TimelineQuery.rb`, `TimelineBuilder.rb`, `UnifiedTimeline.tsx` | Harmonizar campos `kind` e `type` nos builders Rails | Eventos filtrados corretamente no frontend | Jest / RTL test | **IN_PROGRESS** |
| **T-015** | GAP-00 | US-CRM-045 | T-002 | `tenant_scope.rb`, `authorization_service.rb` | Auditoria de isolamento multi-tenant | Proibido acesso cruzado entre contas | Rails spec audit | **PASS** |
| **T-016** | GAP-14 | US-CRM-039 | T-005 | `lib/offline/config.ts`, `mutationQueue.ts` | Avaliação de risco de substituição por conflictKey | Fila offline desativada por padrão no CRM | Análise de segurança | **PASS** |
| **T-017** | GAP-14 | US-CRM-038 | T-016 | `lib/offline/*`, `AuthContext.tsx` | Garantir isolamento e expiração de dados no logout | Sem vazamento de dados de sessão anterior | Inspeção e testes | **PASS** |

### Sprint 2 — Shell & PWA Real (P0/P1)
| TASK_ID | GAP_ID | USER_STORY | DEPENDS_ON | FILES | ACTION | ACCEPTANCE CRITERIA | TEST | STATUS |
|---------|--------|------------|------------|-------|--------|---------------------|------|--------|
| **T-020** | GAP-03 | US-CRM-005 | T-003 | `SalesLayoutWrapper.tsx` | Integrar layout responsivo Web x PWA sem quebrar desktop | Desktop preserva sidebar/topbar; PWA tem layout limpo | Responsividade 320/768/1440 | **PASS** |
| **T-021** | GAP-03 | US-CRM-005 | T-020 | `CRMSidebar.tsx` | Garantir ocultação em `< 768px` e expansão em `≥ 1024px` | Zero overflow horizontal na página | CSS/Viewport inspection | **PASS** |
| **T-022** | GAP-03 | US-CRM-006 | T-020 | `CRMTopbar.tsx` | Topbar compacta responsiva com botão de busca e novo | Elementos acessíveis e alinhados | Jest / DOM test | **PASS** |
| **T-023** | GAP-03 | US-CRM-006 | T-020 | `components/sales/layout/CRMMobileBottomNav.tsx` | Criar barra inferior CRM (Hoje, Pipeline, Empresas, Tarefas, Mais) | Altura 54px + safe-area; indicador ativo | Jest unit test | **PASS** |
| **T-024** | GAP-03 | US-CRM-008 | T-003 | `CRMMobileMoreSheet.tsx`, `CRMGlobalCreateHost.tsx` | Unificar acionador global de criação no mobile | Abre modal com contexto correto | Interação / RTL test | **PASS** |
| **T-025** | GAP-07 | US-CRM-011 | T-002 | `CRMCommandPalette.tsx` | Otimizar busca mobile com foco e dismiss seguro do teclado | Busca rápida sem travar scroll | Interação manual/test | **PASS** |
| **T-026** | GAP-03 | US-CRM-002 | T-003 | `components/sales/ui/CRMModal.tsx` | Adaptar modal responsivo para mobile com scroll interno | Scroll interno e backdrop acessível | Viewport 375x812 | **PASS** |

### Sprints 3 a 6 — Jornadas Comerciais, Propostas, IA e Qualidade
| TASK_ID | GAP_ID | USER_STORY | DEPENDS_ON | FILES | ACTION | STATUS |
|---------|--------|------------|------------|-------|--------|--------|
| **T-030** | GAP-06 | US-CRM-010 | T-020 | `today/page.tsx` | Otimizar visualização de tarefas do dia e próximas ações | **PASS** |
| **T-031** | GAP-08 | US-CRM-018 | T-020 | `PipelineBoard.tsx` | Suportar visualização por toque/diálogo de estágio e snap mobile | **PASS** |
| **T-033** | GAP-08 | US-CRM-019 | T-031 | `ChangeStage.rb`, `OpportunitiesController.rb` | Transição atômica de estágio com rollback no erro | **PASS** |
| **T-050** | GAP-12 | US-CRM-032 | T-020 | `QuoteBuilder.tsx`, `CreateQuoteModal.tsx` | Preenchimento automático de oportunidade em propostas e normalização | **PASS** |
| **T-060** | GAP-13 | US-CRM-027 | Nenhuma | IA / Áudio | Pesquisa de provider de transcrição sob LGPD | **BLOCKED** |
| **T-070** | GAP-00 | US-CRM-046 | T-005 | `AB0-1-front` | Auditoria de acessibilidade WCAG AA e budgets | **PLANNED** |
