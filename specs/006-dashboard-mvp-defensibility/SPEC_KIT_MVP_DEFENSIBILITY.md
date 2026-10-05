# Spec Kit Mestre — MVP Dashboard B2B Funcional e Comercialmente Defensável

> Documento único que consolida PRD/PDR, user stories, requisitos mínimos, domínio, plano, task list, prompts executáveis, critérios de teste e gate comercial. Derivado da auditoria em docs/dashboard-audit.

**Status:** Draft executável para implementação controlada  
**Data:** 30/09/2026  
**Feature:** 006-dashboard-mvp-defensibility  
**Produto:** Avalia Solar 2026 — Dashboard B2B  
**Entrada E2E:** /dashboard?company_id=372

## 1. Decisão executiva

Estimativa atual:

- MVP tecnicamente funcional: **70%**;
- defensibilidade comercial operacional: **40%**;
- prontidão geral ponderada: **55%**.

Meta do plano:

- **≥85% funcional** após E2E autenticado web/PWA;
- **≥65% defensável operacionalmente** após isolamento de tenant, dados confiáveis, auditoria, freshness e prova de valor;
- nenhum bloqueador P0/P1 aberto no go-live.

São metas internas de prontidão, não probabilidade de receita, product-market fit ou moat. Defensibilidade comercial exige validação com clientes.

## 2. Evidência e limites

Fontes:

- docs/dashboard-audit/DASHBOARD_FULL_STACK_E2E_AUDIT.md
- docs/dashboard-audit/DASHBOARD_FINDINGS.md
- docs/dashboard-audit/DASHBOARD_REQUEST_TO_RENDER_TRACE.md
- docs/dashboard-audit/DASHBOARD_STATE_PERSISTENCE_CATALOG.md
- docs/dashboard-audit/DASHBOARD_EVIDENCE_INDEX.md

O probe seguro de produção retornou HTTP 307 para login e release cde2d0f5cc9c353fec94d3bce5a2610be275e9c4. Não foram coletados payloads autenticados, banco real, jobs, realtime, PWA instalada ou performance real. Requisitos runtime devem ser validados em staging/teste autorizado.

Evidence labels:

- PROVED: observado diretamente;
- SUPPORTED: múltiplas evidências, aguardando runtime;
- INFERRED: consequência provável;
- NOT VERIFIED: não coletado;
- NOT FOUND: não localizado na busca, sem afirmar inexistência.

## 3. PRD/PDR

### Problema

O gestor solar precisa saber o que aconteceu, qual próxima ação executar e se cada número pertence à empresa correta, ao período correto e a uma fonte confiável. A auditoria encontrou contexto de empresa ambíguo, cache autenticado sem escopo, erros mascarados por zeros/vazios, GET de ICP com escrita, métrica mockada e ausência de prova runtime autenticada.

### Visão

Um cockpit B2B que transforma presença digital, leads, reputação, catálogo e campanhas em decisões comerciais rastreáveis, explicando origem, freshness, entitlement e falhas.

### Proposta de valor

“Em até cinco minutos, um gestor confirma a empresa correta, entende performance, encontra a próxima ação comercial e sabe explicar números ausentes, atrasados ou bloqueados.”

### Personas

| Persona | Resultado | Risco |
|---|---|---|
| Owner/admin | decidir e editar conteúdo | tenant errado/mutation indevida |
| Operador comercial | qualificar leads | origem, consentimento ou SLA ausente |
| Marketing | provar attribution | métrica inconsistente/mockada |
| Admin plataforma | diagnosticar contas | trace sem empresa efetiva |
| Suporte/auditor | reproduzir incidente | URL/período/request ID ausente |

### Objetivos mensuráveis

| Objetivo | Meta | Evidência |
|---|---:|---|
| Contexto correto | 100% cenários auth/sem auth | E2E + logs |
| Integridade | 0 mocks como métricas reais | payload/UI |
| Estados | 100% no_data/locked/unavailable/error | contrato/UI |
| Performance | p95 bootstrap ≤ 2,5s em staging | trace |
| Tarefa principal | ≥90% vê performance e abre lead | piloto |
| Freshness | 100% cards com source/as_of | snapshot |
| PWA | install/offline/recovery | browser/E2E |
| Operação | 100% erros P1 com request ID | logs |
| Valor | 3 pilotos confirmam decisão acionada | scorecard |

### Não objetivos

- Não reescrever o dashboard inteiro.
- Não criar CRM completo sem necessidade comprovada.
- Não misturar métrica de mercado com métrica própria.
- Não criar mock para preencher tela.
- Não declarar moat, ROI ou product-market fit sem clientes.
- Não alterar produção durante implementação.

## 4. User stories

### US1 — Empresa correta e sessão segura (P1)

Como owner/admin com uma ou mais empresas, quero abrir um link e ver somente a empresa solicitada e autorizada, para não decidir com dados de outro tenant.

Aceite: company_id autorizado seleciona a empresa; não autorizado retorna acesso negado sem fallback; ausência usa empresa ativa documentada; troca atualiza cards, queries, realtime, cache e filtros; logs registram requested/effective company e request ID; sem membership não há dados.

### US2 — Dados confiáveis (P1)

Como gestor, quero distinguir dado real, ausência, bloqueio, atraso e erro.

Aceite: stats, reputation, notifications, analytics e attribution usam envelope uniforme; no_data/locked/unavailable/error/stale têm UI própria; rescue não vira zero sem status; mock é removido/rotulado; cards exibem source, as_of e freshness.

### US3 — Leads e campanhas rastreáveis (P1)

Como operador comercial, quero ver lead, origem, campanha, intenção e próxima ação.

Aceite: leads são tenant-scoped; há origem/timestamp/consentimento; attribution informa modelo/janela/timezone; qualificar/atribuir/contatar respeita policy e é auditável; top campaigns separa ausência, bloqueio e erro.

### US4 — ICP sem efeito colateral (P1)

Como gestor, quero consultar e salvar ICP sem uma leitura criar registros.

Aceite: GET inexistente não escreve; defaults só por mutation idempotente; ranges, estados, cidades, públicos, telhados e carregadores são validados; save comunica sucesso, erro, conflito e tenant.

### US5 — Web/PWA utilizável (P1)

Como gestor mobile ou desktop, quero instalar/reabrir o dashboard como PWA.

Aceite: manifest e ícones válidos; shell offline sem PII indevida; mutation offline não é perdida; reconexão revalida session/company/entitlement; safe-area, teclado, acessibilidade e mobile passam gate.

### US6 — Operação e prova comercial (P1)

Como suporte/admin, quero diagnosticar conta por request ID, empresa efetiva, freshness e entitlement.

Aceite: frontend→Rails→service→log correlacionável; alertas para erro/unavailable/freshness/403/realtime; reprodução por URL/período/empresa/request ID; health não equivale a analytics atualizado.

## 5. Requisitos mínimos

### Bloqueadores MUST

- MUST-01: resolver empresa explicitamente e rejeitar parâmetro inválido.
- MUST-02: eliminar cache de resposta autenticada sem escopo.
- MUST-03: GET de ICP não pode criar registro.
- MUST-04: API/UI distinguem no_data, locked, unavailable e error.
- MUST-05: remover/rotular métrica mockada.
- MUST-06: provar isolamento com permitido, sem acesso e multiempresa.
- MUST-07: validar web e PWA em staging realista.
- MUST-08: nenhuma PII fora da empresa efetiva.
- MUST-09: mutation crítica com trilha de auditoria.
- MUST-10: nenhum teste enfraquecido para CI verde.

### Mínimo funcional

Overview com views, CTAs, leads, reviews, rating e período; leads com origem, timestamp, status e próxima ação; analytics/attribution com janela, timezone, source e freshness; reviews/reputação; perfil/categorias/produtos; ICP; entitlement coerente; loading/empty/locked/unavailable/error/retry/stale; PWA instalável, responsiva e segura.

### Mínimo defensável

Demonstração em cinco minutos; origem explicável; prova de tenant correto; recomendação acionável registrada; indisponibilidade visível; request ID/runbook; três pilotos confirmando uma decisão acionada por conta.

## 6. Domain Spec

### Entidades

| Entidade | Responsabilidade | Invariante |
|---|---|---|
| Company | tenant | toda leitura/mutation company-scoped |
| CompanyMember | usuário/tenant | membership ativa |
| EffectiveCompanyContext | requested/effective/resolution | divergência explícita |
| FeatureEntitlement | plano/feature | estados únicos |
| AnalyticsEvent | comportamento | company/tipo/origem/timestamp |
| CompanyDailyStat | agregado | company+day+source |
| FreshnessSnapshot | idade/status | as_of/source/SLA |
| Lead | oportunidade | distribuição/consentimento/lifecycle |
| CampaignAttribution | evento/campanha/lead | modelo/janela |
| CompanyIcpProfile | critérios | GET não cria |
| Review | reputação | company-scoped/moderável |
| Product/CompanyProduct | catálogo | policy/company |
| AuditEvent | trilha | actor/company/action/target/request/time |

### Invariantes de domínio

1. Resolver contexto antes do service.
2. Parâmetro explícito não autorizado retorna COMPANY_ACCESS_REQUIRED, sem fallback.
3. Ausente pode usar contexto ativo somente após membership.
4. Fallback legítimo declara source/reason.
5. no_data não é error; zero não é semântica implícita.
6. PII só para actor autorizado à empresa efetiva.
7. GET não cria entidade.
8. Realtime invalida queries do mesmo tenant.
9. Datas em UTC; timezone é apresentação/cálculo explícito.
10. Mutation crítica gera AuditEvent idempotente.

### Estados

Feature: loading → enabled | locked | hidden | error  
Data: loading → ready(no_data | populated) | unavailable | error  
Freshness: fresh → stale → expired  
Lead: received → qualified → assigned → contacted → won | lost | disqualified  
ICP: absent → active → updated | archived

## 7. Contratos mínimos

### Contexto

Resposta precisa conter requested_company_id, effective_company_id, resolution, membership_role e request_id. Company explícita não autorizada: HTTP 403, COMPANY_ACCESS_REQUIRED e nenhum payload de outra company. Sem parâmetro: contexto ativo documentado e revalidado.

### Envelope

Campos obrigatórios: status, data, data_source, data_as_of, freshness_seconds quando possível, company_id, request_id, error e meta de period/from/to/timezone.

API usa ready, no_data, locked, unavailable ou error. loading é somente UI. Erro tem code, mensagem segura e retryable, sem PII.

### ICP

- GET /api/v1/dashboard/icp_profile?company_id=:id: somente leitura; ausente retorna no_data.
- PUT /api/v1/dashboard/icp_profile?company_id=:id: update validado/autorizado.
- Initialization, se necessária, é mutation separada e idempotente.

## 8. Arquitetura-alvo

### Frontend

DashboardPage e CompanyContext usam resolver único; EnterpriseDashboard recebe contexto efetivo; PUBLIC_GET_CACHE não guarda respostas autenticadas; logout/troca limpam query cache, estado, realtime e cache de acesso; hooks preservam status/freshness; UI compartilha NoData, Locked, Unavailable, Error e Stale.

### Backend

EffectiveCompanyResolver é comum a company_dashboard, dashboard e company_admin; Pundit continua enforcement; DataEnvelope padroniza metadata; services não fazem fallback silencioso; ICP separa query/init/update; Stats agrega em lote ou declara indisponível.

### Dados/segurança/operação

Evitar migration sem necessidade; qualquer migration exige rollback/backfill. Instrumentar request_id, requested/effective company, endpoint, status, source, freshness e duração. Não logar tokens, cookies, mensagem completa de lead ou payload bruto. Alertar sintomas acionáveis.

## 9. Plan e dependências

Fase 0: baseline/fixtures.  
Fase 1: contexto/envelope/correlação/freshness.  
Fase 2: US1 tenant/cache/E2E.  
Fase 3: US2 estados/mocks/timezone/contratos.  
Fase 4: US3 leads/campanhas/attribution.  
Fase 5: US4 ICP.  
Fase 6: US5 PWA.  
Fase 7: US6 operação/piloto.  
Final: hardening/go-no-go.

Caminho crítico: T003 → T006/T007/T008 → T009 → T010/T012/T014 → T027/T028.

## 10. Task List

### Setup/fundação

- [ ] T001 Criar baseline de aceite em specs/006-dashboard-mvp-defensibility/baseline.md com findings, evidências, confiança e PASS/FAIL/BLOCKED.
- [ ] T002 [P] Criar fixtures multiempresa em AB0-1-back/spec/support/dashboard_mvp_fixtures.rb e AB0-1-front/__tests__/fixtures/dashboardMvp.ts.
- [ ] T003 Implementar resolver efetivo em AB0-1-back/app/services/company_dashboard/effective_company_resolver.rb, controllers, CompanyContext.tsx e dashboard/page.tsx.
- [ ] T004 Implementar envelope em AB0-1-back/app/serializers/company_dashboard/data_envelope.rb, AB0-1-front/types/company-dashboard.ts e componentes de estados.
- [ ] T005 [P] Instrumentar request/freshness em base_controller.rb, company_dashboard_controller.rb, freshness_provider.rb e AB0-1-front/lib/api.ts.

### US1 — tenant/sessão

- [ ] T006 [US1] Tornar company_id determinístico em dashboard/page.tsx, context/CompanyContext.tsx e EnterpriseDashboard.tsx.
- [ ] T007 [US1] Remover fallback silencioso em company_dashboard_controller.rb, company_admin/base_controller.rb, dashboard/base_controller.rb e policies.
- [ ] T008 [US1] Isolar cache/logout em AB0-1-front/lib/api.ts, AuthContext.tsx, CompanyContext.tsx e useCompanyDashboardData.ts.
- [ ] T009 [US1] Criar E2E/requests em dashboard-tenant-isolation.spec.ts e company_dashboard_tenant_spec.rb.

### US2 — dados

- [ ] T010 [US2] Corrigir status de stats/reputation/notifications em company_dashboard_controller.rb e StatsService.
- [ ] T011 [US2] Remover/rotular mock e eliminar N+1 em AB0-1-back/app/services/company_dashboard/stats_service.rb.
- [ ] T012 [US2] Propagar estados na UI em useCompanyDashboardData.ts, OverviewTab.tsx, FeatureGuard.tsx e analytics.
- [ ] T013 [US2] Normalizar UTC/timezone/freshness em TrackingAttributionWorkspace.tsx, useCompanyAnalytics.ts, controller e serviços.
- [ ] T014 [US2] Criar testes de contrato em company_dashboard_data_contract_spec.rb, stats_service_spec.rb e dashboard-data-states.test.tsx.

### US3 — leads/campanhas

- [ ] T015 [US3] Fechar lead → origem → campanha → intenção em attribution_query.rb, dashboard/leads_controller.rb, LeadsOpportunities.tsx e api.ts.
- [ ] T016 [US3] Registrar ações em audit_event.rb, commercial_action_service.rb, controllers e CampaignsMarketing.tsx.
- [ ] T017 [US3] Validar demo E2E em dashboard-lead-to-action.spec.ts e request specs de leads.

### US4 — ICP

- [ ] T018 [US4] Separar read/init/update em icp_profiles_controller.rb, icp_profile_service.rb e rotas.
- [ ] T019 [US4] Fechar validação/UX em icp-api.ts, IcpSetupForm.tsx, app/dashboard/icp/page.tsx e types.
- [ ] T020 [US4] Testar read-only/update/autorização/concorrência em dashboard_icp_profiles_spec.rb e icp-setup-form.test.tsx.

### US5 — web/PWA

- [ ] T021 [US5] Auditar manifest, ícones, service worker e cache em app/manifest.ts, public, next.config e layout.
- [ ] T022 [US5] Implementar offline/reconexão/mutation safety em components, hooks, lib/api.ts e dashboard/layout.tsx.
- [ ] T023 [US5] Corrigir mobile/safe-area/teclado/acessibilidade em dashboard, components e E2E.
- [ ] T024 [US5] Validar instalação/offline/rede em dashboard-pwa.spec.ts e pwa-release-checklist.md.

### US6 — operação/prova

- [ ] T025 [US6] Criar alertas, dashboards e runbook em infra, workflows e docs/runbooks/dashboard-mvp.md.
- [ ] T026 [US6] Instrumentar piloto/valor em frontend analytics, backend analytics, pilot-scorecard.md e docs/dashboard-audit.

### Release

- [ ] T027 Executar hardening de segurança/testes em specs, E2E, cache, Pundit, headers e logs.
- [ ] T028 Executar go/no-go em go-live-checklist.md, consolidar evidências e atualizar percentuais.

## 11. Prompts ultra detalhados por tarefa

### Prompt T001 — baseline

Crie somente baseline.md. Leia AGENTS.md e os documentos da auditoria. Liste DASH-001 a DASH-012 com evidência, confiança, requisito, teste e saída PASS/FAIL/BLOCKED. Separe PROVED, SUPPORTED, INFERRED, NOT VERIFIED e NOT FOUND. Inclua atores, metas 85%/65%, commit e limitações do probe. Não altere código, banco, infraestrutura, .gitignore ou produção.

### Prompt T002 — fixtures

Inspecione factories e schema. Crie fixtures determinísticas para duas empresas, memberships ativa/inativa, owner/admin/operator, usuário sem acesso, planos com/sem analytics e estados ready/no_data/locked/unavailable/error/stale. Não invente colunas; documente BLOCKED se faltar associação. Use PII sintética e compatibilidade RSpec/Jest.

### Prompt T003 — resolver

Implemente resolver testável. Leia CompanyContext, dashboard/page, controllers base, policy e rotas. Explicitamente autorizado resolve; explicitamente não autorizado retorna COMPANY_ACCESS_REQUIRED sem fallback; ausente usa contexto ativo revalidado. Retorne requested/effective/resolution/role/request_id. Conecte frontend/backend/realtime/query keys e cubra T002.

### Prompt T004 — envelope

Crie envelope e tipos para ready/no_data/locked/unavailable/error com data, source, as_of, freshness, company, request, período/timezone e erro seguro. Não use array vazio/zero como semântica única. Crie snapshots/contratos e confirme ausência de PII.

### Prompt T005 — observabilidade

Instrumente base controller, dashboard controller, FreshnessProvider e api.ts. Preserve request ID; registre empresa solicitada/efetiva, endpoint, status, source, freshness e duração. Corrija metadata baseada em current_user.company quando @company for efetiva. Nunca registre token/cookie/lead completo. Teste success/403/500/timeout.

### Prompt T006 — URL

Faça company_id determinístico. Valide companies mine/context; autorizado seleciona; não autorizado mostra erro; ausente usa ativa. Atualize URL, back/forward, refresh, tab e realtime. Cancele requests antigos e invalide queries. Preserve inbox/ICP/quote-form. Teste zero cards de B após A.

### Prompt T007 — backend

Remova fallback silencioso. Parâmetro explícito inválido dá 403 COMPANY_ACCESS_REQUIRED; ausência usa cookie assinado/membership revalidada. Não faça find_or_create em GET. Revise mutations/Pundit e logs requested/effective. Cubra usuário, admin, negado e ausente.

### Prompt T008 — cache

Audite PUBLIC_GET_CACHE. Respostas autenticadas, PII, entitlement e company não podem usar key genérica. Cache anônimo precisa ser provado. Logout limpa React Query, company, realtime, access cache e respostas autenticadas; troca aborta requests/invalida queries. Teste A→B→logout→C na mesma aba.

### Prompt T009 — isolamento

Crie E2E sem mockar autorização inteira: owner A, tentativa B, A+B, sem membership, logout/login, realtime e tabs. Afirme HTTP, effective company, URL, query keys, PII e request ID. Cenário sem ambiente é BLOCKED. Adicione request specs Rails.

### Prompt T010 — erros

Classifique rescues de stats/reputation/notifications/analytics. no_data só após consulta válida sem linhas; unavailable para fonte atrasada; error para falha; locked para entitlement. Fallback declara source/reason. Zero real permanece ready. Teste banco vazio, timeout, exception, feature e fallback.

### Prompt T011 — stats

Remova/rotule views_in_category mockado. Substitua Lead.where no loop por agregação agrupada com schema/índices reais. Separe market potential de lead próprio. Prove query count não linear e nenhum tenant misturado. Migration somente com evidência e rollback.

### Prompt T012 — UI states

Implemente loading, populated, no_data, locked, unavailable, error, retry e stale em cards/gráficos/tabelas. Exiba source/as_of/request quando aplicável, preserve zero legítimo e não mostre spinner infinito. Cubra snapshots, mobile, teclado e leitor de tela.

### Prompt T013 — attribution

Normalize UTC e timezone de apresentação. Envie from/to/timezone/model e data_as_of; preserve filtros reproduzíveis. Teste virada de dia, America/Sao_Paulo, outro timezone, vazio e limite. Não altere histórico sem migration; documente aggregate/event stream.

### Prompt T014 — contratos

Crie contratos para stats, notifications, reputation, overview, timeseries, attribution, ranking e locked. Afirme HTTP, envelope, company, source, freshness, request, retry e ausência de PII. Teste ready-zero contra error-vazio. Não mude expectativa para CI verde.

### Prompt T015 — leads

Feche lead → origem → campanha → intenção. Inspecione schema antes de adicionar campo. Leads devem usar empresa efetiva, timestamp/origem/consentimento; attribution declara modelo/janela/timezone. Diferencie mercado/própria. Cubra tenant e aliases.

### Prompt T016 — audit trail

Implemente auditoria de ações sem conteúdo sensível desnecessário. Reutilize AuditEvent se schema permitir; se migration for necessária, documente antes. Registre actor/company/action/target/request/time/result. Proteja qualificar/atribuir/contatar por policy/idempotência/retry.

### Prompt T017 — demo

Crie E2E: abrir empresa correta, ver lead, abrir origem/campanha, qualificar, registrar próxima ação e verificar auditoria. Use dados sintéticos e empresa sem acesso. Afirme payload/UI, falha/retry e ausência de campanha. Não envie mensagens reais.

### Prompt T018 — ICP backend

Separe GET/init/update. GET ausente retorna no_data e não grava. Defaults usam mutation idempotente, policy e transação. Preserve schema e validações. Teste concorrência, empresa errada, roles e rollback de update inválido.

### Prompt T019 — ICP frontend

Feche loading/no_data/saving/validation/forbidden/conflict/success. Não envie defaults destrutivos; preserve arrays/nulos. Alinhe API/form/page/types ao contrato. Use tokens, safe-area e acessibilidade.

### Prompt T020 — testes ICP

Teste GET sem INSERT/UPDATE, update válido, ranges inválidos, arrays, autorização, concorrência e company mismatch. Frontend testa load/save/error/retry. Use DB de teste e factories; nunca produção.

### Prompt T021 — PWA

Audite manifest, ícones, theme/display/start_url, worker e headers. Não cacheie PII/entitlement de forma insegura. Valide installability, scope, HTTPS/localhost, versionamento e atualização. Não declare pronto sem browser instalado.

### Prompt T022 — offline

Implemente offline/reconexão explícitos. Shell abre offline; dados mostram stale; mutation não é perdida. Fila de ação exige idempotency key e política. Reconexão revalida session/company/entitlement/freshness e conflitos. Teste rede, timeout, 401, retry e troca.

### Prompt T023 — mobile/a11y

Audite viewport mobile/desktop. Corrija safe-area, overflow, foco, teclado, contraste, labels, roles e navegação. Use tokens. Execute ui-audit, lint e testes focados; screenshots só com dados sintéticos.

### Prompt T024 — E2E PWA

Crie Playwright para manifest/install, reload offline, PII, reconexão, stale, retry e mutation safety. Use worker real em ambiente autorizado. Checklist registra PASS/FAIL/BLOCKED, worker, viewport e limitações; não simule instalação.

### Prompt T025 — operação

Crie alertas para erro, unavailable, freshness vencida, 403 anormal, p95 e realtime. Use métricas/logs existentes. Runbook deve ter impacto, confirmação, mitigação, rollback, evidência e escalonamento. Não altere produção automaticamente.

### Prompt T026 — piloto

Crie scorecard de activation, tarefa de cinco minutos, leads vistos, ações, attribution, confiança, retorno e incidentes. Instrumente sem PII, pseudonimizando conta. Colete três contas e só atualize prontidão com evidência, nunca opinião isolada.

### Prompt T027 — hardening

Execute revisão de cache, Pundit, tenant, headers, logs, PII, Brakeman, RuboCop, ESLint, typecheck, testes e E2E. Não desabilite regras, reduza expectativas ou use secrets reais. Classifique falhas novas/preexistentes. MUST aberto bloqueia release.

### Prompt T028 — go/no-go

Preencha checklist com commit, ambiente, versão, migration/rollback, testes, E2E, PWA, performance, freshness, alertas, suporte e pilotos. Marque PASS/FAIL/BLOCKED com evidência. Calcule pesos sem arredondar para cima. Decida GO, CONDITIONAL GO ou NO-GO com owner e riscos aceitos.

## 12. Estratégia de execução

MVP primeiro: T001–T014 fecham tenant e confiabilidade. Sem isso, não liberar demonstração ampla. T002/T005 podem ser paralelas; T018–T020 começam após T003; T021–T024 dependem de contexto/estado.

## 13. Matriz de validação

| Área | Teste | Gate |
|---|---|---|
| Tenant | A, B, A+B, sem acesso, logout | zero cruzamentos |
| API | estados/códigos | 100% contrato |
| Dados | zero real versus erro/vazio | sem fallback |
| ICP | GET sem INSERT; PUT autorizado | obrigatório |
| Leads | origem/ação/auditoria | E2E |
| PWA | install/offline/reconnect | sem PII |
| A11y/mobile | teclado/leitor/viewport/safe-area | CI + manual |
| Performance | p95/query count | meta |
| Operação | request/freshness/alertas | runbook |
| Comercial | três pilotos | evidência |

## 14. Métrica de prontidão

Pesos: tenant/auth/isolamento 25%; dados/contratos/freshness 25%; leads/campanhas/ICP 20%; web/PWA/a11y/mobile 15%; observabilidade/operação 10%; pilotos 5%.

PASS=100, PARTIAL=50, BLOCKED=0. Qualquer MUST aberto limita o total a no máximo 59%. Defensável exige zero P0/P1 e piloto comprovado.

## 15. Go-live checklist

- [ ] Commit e ambiente identificados.
- [ ] T001–T028 possuem evidência.
- [ ] MUST-01 a MUST-10 PASS.
- [ ] Migrations têm rollback.
- [ ] Backend/frontend/E2E PASS.
- [ ] Tenant isolation PASS.
- [ ] Envelope/freshness PASS.
- [ ] ICP GET read-only PASS.
- [ ] Cache/logout/troca PASS.
- [ ] PWA install/offline/reconnect PASS.
- [ ] Acessibilidade/mobile PASS.
- [ ] Alertas/runbook testados.
- [ ] Três pilotos e scorecard anexados.
- [ ] Percentuais recalculados.
- [ ] GO, CONDITIONAL GO ou NO-GO assinado por produto e tecnologia.

## 16. Resultado esperado

Após o caminho crítico, o produto pode ser **MVP funcional para piloto controlado**, não automaticamente produto de escala. “Comercialmente defensável” só após tenant/dados provados, valor demonstrável, falhas observáveis e evidência de uso repetido. Atualizar com fatos, não intenção.
