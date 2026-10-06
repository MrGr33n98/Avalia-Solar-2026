# Tarefas — Jornada completa de propostas (PWA + Web)

## Contexto

Backlog derivado do texto de diagnóstico anexado e da imagem de referência da jornada Avalia Solar. O fluxo deve partir de dados reais, preservar autorização/entitlements e cobrir as dez intenções: lista, detalhes, proposta completa, comparação, conversa, reunião, negociação, escolha, acompanhamento e conclusão com avaliação.

O script padrão `python3 .specify/scripts/python/setup_tasks.py --json` não existe neste checkout. Portanto, este arquivo foi gerado manualmente com base no brief anexado, no código atual e nos contratos Rails/Next.js existentes. Não usar banco de produção nem dados fictícios para validar o fluxo final.

## Critérios globais

- A API deve demonstrar `Lead/request -> LeadDistribution -> MarketplaceProposal -> MarketplaceProposalVersion -> publish -> buyer visibility -> UI`.
- O comprador só pode ver propostas vinculadas por usuário/email permitido; a empresa só pode operar propostas do próprio tenant.
- Drafts são visíveis como estado de preparação, mas não podem ser aceitos.
- Testes de integração reais não devem interceptar `/api/v1/proposals` nem fabricar propostas para mascarar ausência de dados.
- A referência deve ser validada em 390x844, 430x932, 768x1024 e 1440x900.

## Dependências e estratégia

```text
Setup -> Fundamentos -> US1 -> US2 -> US3
                         |       |      |
                         +------> US4 -> US5 -> US6 -> US7
                                  \----------------------> US8 -> US9 -> Polish
```

US1 é o MVP: garantir que uma solicitação respondida por uma empresa crie/publique uma proposta que apareça no comprador. US2–US7 evoluem a jornada sem bloquear a prova do dado real. US8 cobre paridade visual responsiva; US9 fecha E2E, observabilidade e segurança.

## Fase 1 — Setup

- [ ] T001 Criar o registro de evidências da versão implantada, ambiente, endpoint e resultado de `GET /api/v1/proposals` em `docs/proposals/production-evidence.md`.
- [ ] T002 Mapear o contrato atual de propostas, rotas, serializers, políticas e eventos, registrando arquivos reais em `docs/proposals/current-contract.md`.
- [ ] T003 Registrar a matriz de screenshots e os critérios visuais da referência em `docs/proposals/visual-acceptance.md`.
- [ ] T004 Documentar a estratégia de execução local, banco de teste isolado, seed mínimo e comandos de rollback em `docs/proposals/quickstart.md`.

## Fase 2 — Fundamentos bloqueadores

- [ ] T005 Definir o mapa canônico de estados `draft`, `sent`, `viewed`, `negotiating`, `accepted`, `project_in_progress` e `completed` em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb` e `AB0-1-front/lib/api.ts`.
- [ ] T006 Consolidar a matriz de autorização buyer/company/admin e os entitlements de revisão em `AB0-1-back/app/policies/marketplace_proposal_policy.rb` e `docs/proposals/authorization-matrix.md`.
- [ ] T007 Criar builders de fixture realistas, sem interceptar o endpoint, para lead, distribuição, proposta, versão, itens e projeto em `AB0-1-back/spec/support/marketplace_proposal_flow.rb`.
- [ ] T008 Adicionar instrumentação dos eventos de transição e correlação request/lead/distribution/proposal/version em `AB0-1-back/app/services/marketplace/proposal_event_tracker.rb`.
- [ ] T009 Definir o contrato de erro, loading, empty, permission e offline usado pela jornada em `AB0-1-front/components/reviewer/proposals/proposal-state.ts`.

## Fase 3 — US1: solicitação respondida aparece em Minhas propostas (P0)

**Objetivo:** uma empresa recebe uma solicitação, cria/publica uma versão e o comprador vê o card real em `/review-dashboard/proposals`.

**Teste independente:** criar buyer, empresa e lead em banco de teste; distribuir o lead; criar o shell; publicar uma versão; chamar `GET /api/v1/proposals` como buyer; confirmar card, vínculo, status e versão no PWA.

- [ ] T010 [P] [US1] Implementar bootstrap idempotente de `MarketplaceProposal` e versão inicial a partir de `LeadDistribution` em `AB0-1-back/app/services/marketplace/proposal_bootstrap_service.rb`.
- [ ] T011 [US1] Acionar o bootstrap em todos os caminhos de distribuição/routing, mantendo transação e idempotência em `AB0-1-back/app/services/lead_distribution_service.rb` e `AB0-1-back/app/jobs/lead_routing_job.rb`.
- [ ] T012 [US1] Criar migration reversível para backfill de distribuições ativas sem proposta em `AB0-1-back/db/migrate/20261006000000_backfill_marketplace_proposal_drafts.rb`.
- [ ] T013 [US1] Garantir vínculo buyer por usuário/email normalizado e escopo de visibilidade em `AB0-1-back/app/controllers/api/v1/marketplace_proposals_controller.rb` e `AB0-1-back/app/policies/marketplace_proposal_policy.rb`.
- [ ] T014 [US1] Permitir que a empresa crie, edite e publique uma versão somente dentro do tenant e registre a decisão em `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb`.
- [ ] T015 [US1] Impedir aceite de draft, versão ausente ou versão obsoleta e validar a decisão contra a versão publicada em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [ ] T016 [P] [US1] Cobrir bootstrap, idempotência, vínculo buyer e versão inicial em `AB0-1-back/spec/services/marketplace/proposal_bootstrap_service_spec.rb`.
- [ ] T017 [P] [US1] Cobrir distribuição por serviço e job sem duplicar proposta em `AB0-1-back/spec/services/lead_distribution_service_spec.rb` e `AB0-1-back/spec/jobs/lead_routing_job_spec.rb`.
- [ ] T018 [P] [US1] Cobrir draft visível, proposta publicada, tenant e aceite inválido em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_spec.rb`.
- [ ] T019 [US1] Criar teste de jornada request real, sem `page.route`/mock de propostas, de lead distribuído até `GET /api/v1/proposals` em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_flow_spec.rb`.
- [ ] T020 [US1] Renderizar drafts como “Aguardando proposta”, cards publicados e estados de filtro em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx`.
- [ ] T021 [US1] Atualizar o cliente para exigir `versionId` no aceite e preservar o contrato de estado em `AB0-1-front/lib/api.ts`.
- [ ] T022 [US1] Cobrir lista cheia, lista vazia legítima, erro, draft e card publicado com Testing Library em `AB0-1-front/__tests__/components/MarketplaceProposalsWorkspace.test.tsx`.

## Fase 4 — US2: detalhes e proposta completa

**Objetivo:** abrir uma proposta e separar resumo, dados técnicos, condições comerciais, anexos e histórico.

**Teste independente:** com uma versão publicada contendo itens, termos e anexo, abrir o card e confirmar todos os blocos sem overflow mobile.

- [ ] T023 [P] [US2] Separar resumo, detalhes técnicos, equipamentos, condições, prazos, garantias, observações e arquivos em `AB0-1-front/components/reviewer/proposals/ProposalSummary.tsx`.
- [ ] T024 [US2] Criar navegação explícita entre “Detalhes da proposta” e “Proposta completa” em `AB0-1-front/components/reviewer/proposals/ProposalDetailTabs.tsx`.
- [ ] T025 [US2] Expor versão, histórico e anexos no serializer sem vazar dados de empresa/lead fora do escopo em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb`.
- [ ] T026 [P] [US2] Cobrir renderização de dados completos, ausência de campos opcionais e anexo indisponível em `AB0-1-front/__tests__/components/ProposalSummary.test.tsx`.

## Fase 5 — US3: comparação lado a lado

**Objetivo:** selecionar propostas compatíveis e comparar preço, potência, geração, garantia, prazo, instalação e verificação.

**Teste independente:** selecionar duas propostas publicadas; comparar os mesmos campos; bloquear draft/incompatível; manter layout horizontal utilizável no PWA.

- [ ] T027 [P] [US3] Implementar seleção, limite e elegibilidade de comparação em `AB0-1-front/components/reviewer/proposals/ProposalComparison.tsx`.
- [ ] T028 [US3] Garantir ordenação e normalização de unidades/valores comparáveis no contrato de `AB0-1-front/lib/marketplace-proposals.ts`.
- [ ] T029 [P] [US3] Cobrir comparação com duas propostas, campos ausentes e seleção inválida em `AB0-1-front/__tests__/components/ProposalComparison.test.tsx`.

## Fase 6 — US4: conversa contextual com a empresa

**Objetivo:** iniciar ou retomar a conversa já no contexto da proposta, sem criar chat paralelo.

**Teste independente:** clicar “Conversar com a empresa”, chegar ao thread correto com proposal/lead context e retornar ao detalhe preservando a seleção.

- [ ] T030 [US4] Criar deep-link contextual para o chat real com proposal, company e lead em `AB0-1-front/components/reviewer/proposals/ProposalConversationCta.tsx`.
- [ ] T031 [US4] Validar ownership e contexto da conversa antes de abrir o thread em `AB0-1-back/app/controllers/api/v1/conversations_controller.rb`.
- [ ] T032 [P] [US4] Cobrir deep-link, conversa inexistente e retorno para proposta em `AB0-1-front/tests/e2e/proposal-conversation.spec.ts`.

## Fase 7 — US5: reunião e negociação

**Objetivo:** agendar reunião, visualizar versões e solicitar alterações mantendo histórico.

**Teste independente:** agendar horário permitido; criar nova versão; confirmar histórico; solicitar mudança; verificar que a versão anterior permanece auditável.

- [ ] T033 [P] [US5] Implementar seleção de data, horário, modalidade e observação em `AB0-1-front/components/reviewer/proposals/ProposalMeeting.tsx`.
- [ ] T034 [US5] Validar conflito, janela disponível, timezone e ownership da reunião em `AB0-1-back/app/controllers/api/v1/marketplace_proposal_meetings_controller.rb`.
- [ ] T035 [US5] Preservar histórico de versões e evento de solicitação de alteração em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [ ] T036 [P] [US5] Cobrir reunião, negociação, stale version e request change em `AB0-1-back/spec/services/marketplace/proposal_decision_service_spec.rb`.
- [ ] T037 [P] [US5] Cobrir UI de calendário, versões e estados de envio em `AB0-1-front/__tests__/components/ProposalMeeting.test.tsx` e `AB0-1-front/__tests__/components/ProposalNegotiation.test.tsx`.

## Fase 8 — US6: escolher proposta e iniciar projeto

**Objetivo:** confirmar interesse de forma transacional, com versão explícita, e exibir acompanhamento do projeto.

**Teste independente:** confirmar uma versão publicada; rejeitar segunda confirmação concorrente; verificar milestone inicial, contrato e status do projeto.

- [ ] T038 [US6] Implementar confirmação com `version_id`, idempotência e transição atômica em `AB0-1-back/app/services/marketplace/proposal_decision_service.rb`.
- [ ] T039 [US6] Criar ou atualizar projeto/milestones somente após aceite autorizado em `AB0-1-back/app/services/marketplace/project_bootstrap_service.rb`.
- [ ] T040 [P] [US6] Renderizar confirmação e acompanhamento em `AB0-1-front/components/reviewer/proposals/ProposalProject.tsx`.
- [ ] T041 [P] [US6] Cobrir aceite concorrente, versão stale e criação de projeto em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_spec.rb`.

## Fase 9 — US7: projeto concluído e avaliação

**Objetivo:** acompanhar milestones até conclusão e enviar avaliação contextual sem duplicidade.

**Teste independente:** concluir milestones; abrir tela de projeto concluído; enviar avaliação; impedir duplicata e preservar a proposta.

- [ ] T042 [US7] Mapear milestones e conclusão para o estado canônico em `AB0-1-back/app/serializers/marketplace_proposal_serializer.rb`.
- [ ] T043 [US7] Implementar tela de conclusão, empresa, resumo e avaliação em `AB0-1-front/components/reviewer/proposals/ProposalCompleted.tsx`.
- [ ] T044 [US7] Validar rating, comentário, autorização e idempotência da avaliação em `AB0-1-back/app/controllers/api/v1/reviews_controller.rb`.
- [ ] T045 [P] [US7] Cobrir projeto concluído, avaliação enviada e tentativa duplicada em `AB0-1-front/tests/e2e/proposal-completed-review.spec.ts`.

## Fase 10 — US8: paridade visual PWA e Web

**Objetivo:** aproximar a referência sem perder acessibilidade, responsividade e tokens existentes.

**Teste independente:** executar as telas nos quatro breakpoints e comparar screenshots sem overflow horizontal, CTA cortado ou contraste inválido.

- [ ] T046 [P] [US8] Ajustar lista, tabs, cards, status, espaçamento e bottom navigation aos tokens AS-EDS em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx`.
- [ ] T047 [P] [US8] Ajustar detalhes, comparação, reunião, negociação, escolha, projeto e conclusão à referência em `AB0-1-front/components/reviewer/proposals/`.
- [ ] T048 [US8] Adicionar screenshots de regressão para 390, 430, 768 e 1440 em `AB0-1-front/tests/e2e/fixtures/proposals-reference/`.
- [ ] T049 [US8] Validar teclado, foco, labels, landmarks, contraste e ausência de overflow em `AB0-1-front/tests/e2e/marketplace-proposals.spec.ts`.

## Fase 11 — US9: E2E real, observabilidade e segurança

**Objetivo:** provar a jornada em banco de teste e deixar produção diagnosticável sem expor dados sensíveis.

**Teste independente:** rodar o fluxo completo sem mocks de proposta; coletar eventos correlacionados; confirmar logs sem token/email sensível; exercitar escopos buyer/company.

- [ ] T050 [P] [US9] Substituir fixtures interceptadas por setup/teardown de banco de teste no fluxo Playwright em `AB0-1-front/tests/e2e/marketplace-proposals.spec.ts`.
- [ ] T051 [US9] Adicionar cenário Playwright PWA completo e Web completo contra API real em `AB0-1-front/tests/e2e/proposals-real-journey.spec.ts`.
- [ ] T052 [US9] Adicionar métricas de funil `proposal_created`, `proposal_published`, `proposal_viewed`, `proposal_compared`, `proposal_accepted` e `project_completed` em `AB0-1-back/app/services/marketplace/proposal_event_tracker.rb`.
- [ ] T053 [US9] Cobrir IDOR, buyer mismatch, company mismatch e draft disclosure em `AB0-1-back/spec/requests/api/v1/marketplace_proposals_security_spec.rb`.
- [ ] T054 [US9] Criar runbook para diagnosticar `proposals=[]` desde request até serializer em `docs/runbooks/proposals-empty-state.md`.
- [ ] T055 [US9] Documentar deploy, migration, smoke test, rollback e prova do SHA servido em `docs/proposals/production-checklist.md`.

## Fase final — Polish e validação cruzada

- [ ] T056 Executar lint, typecheck, testes focados, build e Playwright nos arquivos do fluxo e registrar resultados em `docs/proposals/validation-report.md`.
- [ ] T057 Verificar migration up/down em banco de teste isolado e registrar contagem antes/depois em `docs/proposals/migration-evidence.md`.
- [ ] T058 Revisar strings, analytics, loading, empty, error, permission e offline em `AB0-1-front/components/reviewer/MarketplaceProposalsWorkspace.tsx` e `AB0-1-front/components/reviewer/proposals/`.
- [ ] T059 Fazer revisão de segurança final para não incluir tokens, dados pessoais, mock de produção ou logs sensíveis em `AB0-1-back/app/` e `AB0-1-front/tests/`.
- [ ] T060 Atualizar o relatório final de paridade e gaps remanescentes em `docs/proposals/implementation-report.md`.

## Oportunidades de execução paralela

- Após T009: T010–T015 podem ser divididas entre bootstrap/API, políticas e cliente; T016–T018 acompanham cada área.
- Após US1: US2, US3 e US4 podem avançar em paralelo porque consomem o contrato publicado sem alterar a criação da proposta.
- US5, US6 e US7 devem seguir a ordem de transição de estado, mas testes de UI e backend de cada fase podem rodar em paralelo.
- US8 pode ser trabalhada em paralelo com US4–US7 depois que os estados e CTAs estiverem estáveis.
- US9 e Polish só fecham após os fluxos funcionais, para evitar validar screenshots ou métricas sobre dados falsos.

## MVP sugerido

Entregar T005–T022 (US1), incluindo bootstrap idempotente, publicação real, vínculo buyer/email, endpoint visível, bloqueio de aceite de draft e teste request real. Só depois avançar para a paridade das dez telas; a tela vazia não deve ser usada como substituto de uma proposta inexistente.

