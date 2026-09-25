# Tasks: CRM Tenant Isolation & Referential Integrity Hardening

**Feature Branch**: `002-crm-tenant-integrity`
**Spec**: `specs/002-crm-tenant-integrity/spec.md`
**Plan**: `specs/002-crm-tenant-integrity/plan.md`

## Critérios independentes por história

- **US1 — isolamento de leitura**: com fixtures persistidas de A e B, requests autenticados como A retornam somente IDs, nomes, descrições e agregados permitidos de A; ID B e ID inexistente produzem a mesma resposta externa; catálogo global permanece global sem expor registros comerciais.
- **US2 — integridade relacional**: mutações válidas dentro do mesmo agregado persistem; cada FK cruzada ou incompatível é rejeitada antes de qualquer escrita ou enqueue; contato pode usar vínculos atuais legítimos a mais de uma conta do mesmo tenant.
- **US3 — exceções de admin**: admin conserva somente o acesso global já previsto por action; actions owner-only continuam owner-only; relações incompatíveis são recusadas inclusive para admin.

## Dependências e estratégia

Ordem: Setup → Fundamentos → US1 → US2 → US3 → validação final. US1, US2 e US3 dependem dos fundamentos; US2 e US3 podem avançar em paralelo após os fundamentos, desde que trabalhem em arquivos distintos. Não há migration prevista. Today não pode mudar sua dimensão de owner enquanto a decisão de produto estiver aberta. Os testes usam apenas banco de teste confirmado e não chamam provedores reais de email.

## Phase 1: Setup e segurança do ambiente

- [X] T001 Confirmar configuração de teste e abortar diante de ambiente ou banco ambíguo em `AB0-1-back/spec/rails_helper.rb`
- [X] T002 Inventariar rotas Sales e mapear cada lookup/associação da matriz para os specs focados em `AB0-1-back/config/routes.rb` e `AB0-1-back/spec/requests/api/v1/sales/`

## Phase 2: Fundamentos de tenant e integridade

- [X] T003 [P] Definir escopo canônico de Account, Contact, Opportunity, Task, Activity, Note e Quote sem OR que una âncoras conflitantes em `AB0-1-back/app/services/sales/tenant_scope.rb`
- [X] T004 [P] Implementar helpers de paridade de Account, Contact, Opportunity, Employment e owner sem criar um serviço universal de lookup em `AB0-1-back/app/services/sales/tenant_scope.rb`
- [X] T005 Registrar recusas com request_id, action, tipo de recurso e motivo estável sem PII ou IDs ocultos nos controllers Sales em `AB0-1-back/app/controllers/api/v1/sales/base_controller.rb`
- [X] T006 Padronizar respostas para não distinguir recurso oculto de inexistente e preservar 401/403/422 conforme contrato em `AB0-1-back/app/controllers/api/v1/sales/`

## Phase 3: User Story 1 — isolamento de leitura (P0)

- [X] T007 [P] Escopar fila Today por tenant para overdue, today, upcoming, no_next_action e stale, mantendo stale > cinco dias e a semântica atual de owner em `AB0-1-back/app/controllers/api/v1/sales/today_controller.rb`
- [X] T008 [P] Aplicar lookup scoped e âncora canônica a detalhes, listas e contagens de Account, Contact e Opportunity em `AB0-1-back/app/controllers/api/v1/sales/accounts_controller.rb`, `AB0-1-back/app/controllers/api/v1/sales/contacts_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/opportunities_controller.rb`
- [X] T009 [P] Escopar Activities e Tasks por pai autorizado e preservar Task owner=current_user nas listagens em `AB0-1-back/app/controllers/api/v1/sales/activities_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/tasks_controller.rb`
- [X] T010 [P] Resolver Qualification via Opportunity e Consent via Contact autorizados em `AB0-1-back/app/controllers/api/v1/sales/qualifications_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/consents_controller.rb`
- [X] T011 [P] Escopar Search, Notes, OpportunityContacts, QuoteItems e TrackingIdentity nos fluxos internos identificados em `AB0-1-back/app/controllers/api/v1/sales/search_controller.rb`, `AB0-1-back/app/controllers/api/v1/sales/notes_controller.rb`, `AB0-1-back/app/controllers/api/v1/sales/opportunity_contacts_controller.rb`, `AB0-1-back/app/controllers/api/v1/sales/quote_items_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/tracking_identity_controller.rb`
- [X] T012 Cobrir leituras, detalhes aninhados, listas e agregados A/B com banco de teste em `AB0-1-back/spec/requests/api/v1/sales/tenant_isolation_read_spec.rb`

## Phase 4: User Story 2 — relações coerentes em mutações (P0)

- [X] T013 Validar Account, Contact e Opportunity no trio de Activity antes de persistir e derivar actor de current_user em `AB0-1-back/app/controllers/api/v1/sales/activities_controller.rb`
- [X] T014 Validar Account obrigatória e FKs opcionais em create/update de Task, preservando owner=current_user e impedindo update sobre task fora do escopo em `AB0-1-back/app/controllers/api/v1/sales/tasks_controller.rb`
- [X] T015 Validar Account e responsável nas mutações de Contact; validar pai, vínculo e conta em todas as actions de ContactEmployment em `AB0-1-back/app/controllers/api/v1/sales/contacts_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/contact_employments_controller.rb`
- [X] T016 Validar account, primary_contact, contact_ids, owner e stage-pipeline em criação, conversão, update e bulk de Lead/Opportunity, mantendo atomicidade e catálogos globais em `AB0-1-back/app/services/sales/leads/create.rb`, `AB0-1-back/app/services/sales/lead_conversion_service.rb` e `AB0-1-back/app/services/sales/opportunities/`
- [X] T017 Validar FKs de OpportunityContact, Note e QuoteItem no mesmo agregado em `AB0-1-back/app/controllers/api/v1/sales/opportunity_contacts_controller.rb`, `AB0-1-back/app/controllers/api/v1/sales/notes_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/quote_items_controller.rb`
- [X] T018 Validar Contact/Account/Opportunity, company_id, template e campaign aceitos antes de criar EmailMessage ou enfileirar job, sem implementar envio/deliverability em `AB0-1-back/app/controllers/api/v1/sales/emails_controller.rb`
- [X] T019 Validar Company de origem antes de criar AccountLink e IDs de contexto aceitos por preview/test_send em `AB0-1-back/app/controllers/api/v1/sales/account_links_controller.rb` e `AB0-1-back/app/controllers/api/v1/sales/email_templates_controller.rb`
- [X] T020 Garantir lookup scoped e coerência de Contact/Opportunity recebidos por TrackingIdentity sem associar IDs públicos não comprovados em `AB0-1-back/app/controllers/api/v1/sales/tracking_identity_controller.rb`
- [X] T021 Cobrir mutações válidas e FKs ausentes, ocultas e incompatíveis sem escrita parcial ou enqueue em `AB0-1-back/spec/requests/api/v1/sales/referential_integrity_spec.rb`

## Phase 5: User Story 3 — bypass administrativo explícito (P0)

- [X] T022 Documentar e aplicar exceções de admin por action, preservando Tasks owner-only e os limites de Campaigns, EmailTemplates e AccountLinks em `AB0-1-back/app/services/sales/authorization_service.rb` e controllers correspondentes
- [X] T023 Cobrir admin global permitido, ação owner-only e rejeição de relações entre tenants em `AB0-1-back/spec/requests/api/v1/sales/admin_boundaries_spec.rb`

## Phase 6: Polish e validação

- [X] T024 Auditar fluxos Sales irmãos que recebem IDs e registrar cada um como coberto ou follow-up, sem refatoração geral do namespace em `AB0-1-back/config/routes.rb` e `specs/002-crm-tenant-integrity/spec.md`
- [X] T025 Executar specs focados e regressões Sales somente após confirmar RAILS_ENV=test e banco efetivo; registrar comandos, resultados, limitações e status VERIFIED/PARTIAL em `specs/002-crm-tenant-integrity/quickstart.md`
- [X] T026 Confirmar que nenhuma mutação recusada cria registros/jobs, que nenhum teste chama email real e que os consumidores API mantêm os fluxos válidos em `AB0-1-front/lib/api/sales/client.ts`

## Dependências entre histórias

- Fundamentos (T003–T006) bloqueiam as três histórias.
- US1 (T007–T012) valida primeiro o universo de leitura e os pais scoped.
- US2 (T013–T021) depende dos lookups de US1; Lead e Opportunity dependem dos helpers de T004.
- US3 (T022–T023) depende do escopo e das validações de US2.
- Polish (T024–T026) depende das três histórias.

## Oportunidades de paralelismo

- Após T001–T006, US1 pode ser dividido entre Today, consultas base e endpoints irmãos, desde que cada tarefa mantenha alteração em arquivos distintos.
- Após T004, US2 pode ser dividido entre Activity/Task, Contact/Employment, Lead/Opportunity e Notes/Quotes/Email.
- T012, T021 e T023 podem ser escritos em paralelo quando fixtures/helpers de teste estiverem estáveis e os arquivos forem distintos.

## Estratégia de implementação

Entregar primeiro isolamento de leitura (US1), depois integridade de escrita (US2), e por fim os limites administrativos (US3). Cada fase deve manter jornadas válidas no mesmo tenant e ocultar IDs externos. Não criar migration sem evidência estrutural e plano reversível. A fila Today mantém a semântica de owner até decisão de produto. Envio produtivo, deliverability, campanhas como operação, tracking de produto e automações de follow-up permanecem fora desta feature; o email aqui cobre apenas coerência de relações e bloqueio antes do enqueue.
