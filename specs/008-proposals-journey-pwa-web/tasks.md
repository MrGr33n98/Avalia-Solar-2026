# Tarefas — Jornada completa de propostas (PWA + Web)

## Contexto

Backlog derivado do texto de diagnóstico anexado e da imagem de referência da jornada Avalia Solar. O fluxo parte de dados reais, preserva autorização/entitlements e cobre as dez intenções: lista, detalhes, proposta completa, comparação, conversa, reunião, negociação, escolha, acompanhamento e conclusão com avaliação.

## Critérios globais

- A API demonstra `Lead/request -> LeadDistribution -> MarketplaceProposal -> MarketplaceProposalVersion -> publish -> buyer visibility -> UI`.
- O comprador só pode ver propostas vinculadas por usuário/email permitido; a empresa só pode operar propostas do próprio tenant.
- Drafts são visíveis como estado de preparação, mas não podem ser aceitos.
- Testes de integração reais não interceptam `/api/v1/proposals` nem fabricam propostas para mascarar ausência de dados.
- A referência foi validada em 390x844, 430x932, 768x1024 e 1440x900.

## Fase 1 — Setup

- [X] T001 Criar o registro de evidências da versão implantada, ambiente, endpoint e resultado de `GET /api/v1/proposals` em `docs/proposals/production-evidence.md`.
- [X] T002 Mapear o contrato atual de propostas, rotas, serializers, políticas e eventos, registrando arquivos reais em `docs/proposals/current-contract.md`.
- [X] T003 Registrar a matriz de screenshots e os critérios visuais da referência em `docs/proposals/visual-acceptance.md`.
- [X] T004 Documentar a estratégia de execução local, banco de teste isolado, seed mínimo e comandos de rollback em `docs/proposals/quickstart.md`.

## Fase 2 — Fundamentos bloqueadores

- [X] T005 Definir o mapa canônico de estados `draft`, `sent`, `viewed`, `negotiating`, `accepted`, `project_in_progress` e `completed` em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb` e `AB0-1-front/lib/api.ts`.
- [X] T006 Consolidar a matriz de autorização buyer/company/admin e os entitlements de revisão em `AB0-1-back/app/policies/marketplace_proposal_policy.rb` e `docs/proposals/authorization-matrix.md`.
- [X] T007 Criar builders de fixture realistas, sem interceptar o endpoint, para lead, distribuição, proposta, versão, itens e projeto em `AB0-1-back/spec/support/marketplace_proposal_flow.rb`.
- [X] T008 Adicionar instrumentação dos eventos de transição e correlação request/lead/distribution/proposal/version em `AB0-1-back/app/services/marketplace/proposal_event_tracker.rb`.
- [X] T009 Definir o contrato de erro, loading, empty, permission e offline usado pela jornada em `AB0-1-front/components/reviewer/proposals/proposal-state.ts`.

## Fase 3 — US1: solicitação respondida aparece em Minhas propostas (P0)

- [X] T010 [P] [US1] Implementar bootstrap idempotente de `MarketplaceProposal` e versão inicial a partir de `LeadDistribution` em `AB0-1-back/app/services/marketplace/proposal_bootstrap_service.rb`.
- [X] T011 [US1] Acionar o bootstrap em todos os caminhos de distribuição/routing, mantendo transação e idempotência em `AB0-1-back/app/services/lead_distribution_service.rb` e `AB0-1-back/app/jobs/lead_routing_job.rb`.
- [X] T012 [US1] Criar migration reversível para backfill de distribuições ativas sem proposta em `AB0-1-back/db/migrate/20261006000000_backfill_marketplace_proposal_drafts.rb`.
- [X] T013 [US1] Garantir vínculo buyer por usuário/email normalizado e escopo de visibilidade em `AB0-1-back/app/controllers/api/v1/marketplace_proposals_controller.rb` e `AB0-1-back/app/policies/marketplace_proposal_policy.rb`.
- [X] T014 [US1] Permitir que a empresa crie, edite e publique uma versão somente dentro do tenant e registre a decisão em `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb`.
- [X] T015 [US1] Impedir aceite de draft, versão ausente ou versão obsoleta e validar a decisão contra a versão publicada em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [X] T016 [P] [US1] Cobrir bootstrap, idempotência, vínculo buyer e versão inicial em `AB0-1-back/spec/services/marketplace/proposal_bootstrap_service_spec.rb`.
- [X] T017 [P] [US1] Cobrir distribuição por serviço e job sem duplicar proposta em `AB0-1-back/spec/services/lead_distribution_service_spec.rb` e `AB0-1-back/spec/jobs/lead_routing_job_spec.rb`.
- [X] T018 [P] [US1] Cobrir draft visível, proposta publicada, tenant e aceite inválido em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_spec.rb`.
- [X] T019 [US1] Criar teste de jornada request real, sem `page.route`/mock de propostas, de lead distribuído até `GET /api/v1/proposals` em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_flow_spec.rb`.
- [X] T020 [US1] Renderizar drafts como “Aguardando proposta”, cards publicados e estados de filtro em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx`.
- [X] T021 [US1] Atualizar o cliente para exigir `versionId` no aceite e preservar o contrato de estado em `AB0-1-front/lib/api.ts`.
- [X] T022 [US1] Cobrir lista cheia, lista vazia legítima, erro, draft e card publicado com Testing Library em `AB0-1-front/__tests__/components/MarketplaceProposalsWorkspace.test.tsx`.

## Fase 4 — US2: detalhes e proposta completa

- [X] T023 [P] [US2] Separar resumo, detalhes técnicos, equipamentos, condições, prazos, garantias, observações e arquivos em `AB0-1-front/components/reviewer/proposals/ProposalSummary.tsx`.
- [X] T024 [US2] Criar navegação explícita entre “Detalhes da proposta” e “Proposta completa” em `AB0-1-front/components/reviewer/proposals/ProposalDetailTabs.tsx`.
- [X] T025 [US2] Expor versão, histórico e anexos no serializer sem vazar dados de empresa/lead fora do escopo em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb`.
- [X] T026 [P] [US2] Cobrir renderização de dados completos, ausência de campos opcionais e anexo indisponível em `AB0-1-front/__tests__/components/ProposalSummary.test.tsx`.

## Fase 5 — US3: comparação lado a lado

- [X] T027 [P] [US3] Implementar seleção, limite e elegibilidade de comparação em `AB0-1-front/components/reviewer/proposals/ProposalComparison.tsx`.
- [X] T028 [US3] Garantir ordenação e normalização de unidades/valores comparáveis no contrato de `AB0-1-front/lib/marketplace-proposals.ts`.
- [X] T029 [P] [US3] Cobrir comparação com duas propostas, campos ausentes e seleção inválida em `AB0-1-front/__tests__/components/ProposalComparison.test.tsx`.

## Fase 6 — US4: conversa contextual com a empresa

- [X] T030 [US4] Criar deep-link contextual para o chat real com proposal, company e lead em `AB0-1-front/components/reviewer/proposals/ProposalConversationCta.tsx`.
- [X] T031 [US4] Validar ownership e contexto da conversa antes de abrir o thread em `AB0-1-back/app/controllers/api/v1/conversations_controller.rb`.
- [X] T032 [P] [US4] Cobrir deep-link, conversa inexistente e retorno para proposta em `AB0-1-front/tests/e2e/proposal-conversation.spec.ts`.

## Fase 7 — US5: reunião e negociação

- [X] T033 [P] [US5] Implementar seleção de data, horário, modalidade e observação em `AB0-1-front/components/reviewer/proposals/ProposalMeeting.tsx`.
- [X] T034 [US5] Validar conflito, janela disponível, timezone e ownership da reunião em `AB0-1-back/app/controllers/api/v1/marketplace_proposal_meetings_controller.rb`.
- [X] T035 [US5] Preservar histórico de versões e evento de solicitação de alteração em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [X] T036 [P] [US5] Cobrir reunião, negociação, stale version e request change em `AB0-1-back/spec/services/marketplace/proposal_decision_service_spec.rb`.
- [X] T037 [P] [US5] Cobrir UI de calendário, versões e estados de envio em `AB0-1-front/__tests__/components/ProposalMeeting.test.tsx` e `AB0-1-front/__tests__/components/ProposalNegotiation.test.tsx`.

## Fase 8 — US6: escolher proposta e iniciar projeto

- [X] T038 [US6] Implementar confirmação com `version_id`, idempotência e transição atômica em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [X] T039 [US6] Criar ou atualizar projeto/milestones somente após aceite autorizado em `AB0-1-back/app/services/marketplace/project_bootstrap_service.rb`.
- [X] T040 [P] [US6] Renderizar confirmação e acompanhamento em `AB0-1-front/components/reviewer/proposals/ProposalProject.tsx`.
- [X] T041 [P] [US6] Cobrir aceite concorrente, versão stale e criação de projeto em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_spec.rb`.

## Fase 9 — US7: projeto concluído e avaliação

- [X] T042 [US7] Mapear milestones e conclusão para o estado canônico em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb`.
- [X] T043 [US7] Implementar tela de conclusão, empresa, resumo e avaliação em `AB0-1-front/components/reviewer/proposals/ProposalCompleted.tsx`.
- [X] T044 [US7] Validar rating, comentário, autorização e idempotência da avaliação em `AB0-1-back/app/controllers/api/v1/reviews_controller.rb`.
- [X] T045 [P] [US7] Cobrir projeto concluído, avaliação enviada e tentativa duplicada em `AB0-1-front/tests/e2e/proposal-completed-review.spec.ts`.

## Fase 10 — US8: paridade visual PWA e Web

- [X] T046 [P] [US8] Ajustar lista, tabs, cards, status, espaçamento e bottom navigation aos tokens AS-EDS em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx`.
- [X] T047 [P] [US8] Ajustar detalhes, comparação, reunião, negociação, escolha, projeto e conclusão à referência em `AB0-1-front/components/reviewer/proposals/`.
- [X] T048 [US8] Adicionar screenshots de regressão para 390, 430, 768 e 1440 em `AB0-1-front/tests/e2e/fixtures/proposals-reference/`.
- [X] T049 [US8] Validar teclado, foco, labels, landmarks, contraste e ausência de overflow em `AB0-1-front/tests/e2e/marketplace-proposals.spec.ts`.

## Fase 11 — US9: E2E real, observabilidade e segurança

- [ ] T050 [P] [US9] E2E com mocking (page.route) cobre jornada visual completa em `AB0-1-front/tests/e2e/marketplace-proposals.spec.ts`; migração para setup/teardown de banco de teste isolado pendente de infra dedicada.
- [X] T051 [US9] Adicionar cenário Playwright PWA e Web para validação de container de jornada em `AB0-1-front/tests/e2e/proposals-real-journey.spec.ts`.
- [X] T052 [US9] Adicionar métricas de funil `proposal_created`, `proposal_published`, `proposal_viewed`, `proposal_compared`, `proposal_accepted` e `project_completed` em `AB0-1-back/app/services/marketplace/proposal_event_tracker.rb`.
- [X] T053 [US9] Cobrir IDOR, buyer mismatch, company mismatch e draft disclosure em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_security_spec.rb`.
- [X] T054 [US9] Criar runbook para diagnosticar `proposals=[]` desde request até serializer em `docs/runbooks/proposals-empty-state.md`.
- [X] T055 [US9] Documentar deploy, migration, smoke test, rollback e prova do SHA servido em `docs/proposals/production-checklist.md`.

## Fase final — Polish e validação cruzada

- [X] T056 Executar lint, typecheck, testes focados, build e Playwright nos arquivos do fluxo e registrar resultados em `docs/proposals/validation-report.md`.
- [X] T057 Verificar migration up/down em banco de teste isolado e registrar contagem antes/depois em `docs/proposals/migration-evidence.md`.
- [X] T058 Revisar strings, analytics, loading, empty, error, permission e offline em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx` e `AB0-1-front/components/reviewer/proposals/`.
- [X] T059 Fazer revisão de segurança final para não incluir tokens, dados pessoais, mock de produção ou logs sensíveis em `AB0-1-back/app/` e `AB0-1-front/tests/`.
- [X] T060 Atualizar o relatório final de paridade e gaps remanescentes em `docs/proposals/implementation-report.md`.
