# Tasks: CRM Email Tracking + Timeline Realtime

**Feature**: `specs/004-crm-email-timeline-realtime`  
**Plan**: [plan.md](plan.md)

## Definition of done por story

- US1: SNS retries/out-of-order e pixel/link repetidos são persistidos sem duplicar sinal comercial; suppression e cadence são verificadas.
- US2: timeline DTO tipado, sem duplicate email Activity, tenant-safe e com preview seguro.
- US3: ActionCable autorizado, broadcast após commit, cursor delta e fallback visível funcionam.
- US4: inbound adapter real escolhido; thread/contato/oportunidade resolvidos e cadence parada.
- US5: health/telemetria e gates têm evidência, sem PII/secrets.

## Phase 1 — preflight e contrato

- [x] T001 [P] Registrar baseline Git, inspecionar Compose/Nginx/CI versionados e preservar mudanças locais. Infra efetivamente aplicada em produção não foi confirmada.
- [x] T002 Confirmar modelo/schema atual de events/links/threads e mapear consumidores dos status antigos.
- [ ] T003 Decidir e configurar provider inbound e contrato de recebimento/reply; nenhuma integração inbound utilizável foi encontrada. US4 fica BLOCKED para go-live.
- [ ] T004 Confirmar `EMAIL_TRACKING_HOST`, DNS/certificado, domínio de tracking e política de origem ActionCable para ambientes; nunca ler/imprimir secrets.
- [x] T005 Documentar fonte canônica por classe, regras out-of-order e métricas unique/raw/classification.

## Phase 2 — tracking e lifecycle P0

- [x] T006 [P] Adicionar `EMAIL_TRACKING_HOST` ao `.env.example`, Compose backend/worker e preflight; proibir fallback em produção.
- [x] T007 Corrigir geração de pixel/click/unsubscribe para host dedicado e pixel renderizável, sem `display:none`.
- [x] T008 Aplicar headers no-cache no Rails e no proxy Next/Nginx real; verificar resposta para tokens existentes e inválidos.
- [x] T009 Criar migration reversível para source/received_at/dedupe/classification/schema_version e lifecycle separado, após confirmar nomes/indexes existentes. Migration executada com sucesso no ambiente local.
- [x] T010 Implementar dedupe scoped para pixel/link/provider/inbound; preservar evento raw e provider idempotency.
- [x] T011 Implementar classificador determinístico auditável (proxy/bot/scanner/unknown) sem inventar score/confiança; não chamar unknown de humano.
- [x] T012 Separar contadores raw/unique por opens/clicks e evitar contagem dupla SES SNS + pixel/link. Raw events são mantidos.
- [x] T013 Separar delivery/engagement e proteger transições contra eventos fora de ordem. Testes backend 100% PASS.
- [x] T014 Garantir bounce/complaint/unsubscribe suppression persistente e parada idempotente de campaign/cadence.

## Phase 3 — timeline v2 e API

- [x] T015 Criar `Sales::Timeline::Query` e remover agregação inline do controller.
- [x] T016 Implementar regra opportunity/account-only, excluir atividade de email duplicada e manter TenantScope.
- [x] T017 Serializar actor, direction, preview sanitizado, delivery/engagement, contagens e lifecycle.
- [x] T018 Usar EmailMessage como fonte canônica e excluir Activities de email da lista normal da timeline.
- [x] T019 Criar cursor monotônico e GET delta com suporte a paginação cursor-based.
- [x] T020 Request specs de DTO, ordem, cursor, duplicates e tenant A/B.

## Phase 4 — replies e realtime

- [ ] T021 Implementar inbound adapter escolhido, verificação/autenticação e dedupe; manter idempotency/event source `inbound_email`.
- [ ] T022 Resolver thread/contact/account/opportunity de forma tenant-safe; associar reply e parar cadence após commit.
- [x] T023 Criar `SalesTimelineChannel` com `current_user` e autorização da opportunity antes do stream.
- [x] T024 Adicionar origem CRM à allowlist existente, sem wildcard; handshake no host real pendente.
- [x] T025 Broadcast pequeno after-commit para eventos de email; nenhum corpo ou PII no payload.
- [x] T026 Frontend subscription, cursor delta, reconnect, visibility refetch e polling 20s somente com painel visível.
- [x] T027 Cobrir commit-before-broadcast, autorização, socket desconectado e recuperação sem duplicação.

## Phase 5 — frontend e notificações

- [x] T028 Substituir contrato legado por tipos TS e remover regex/labels “Lido”/“Aguardando leitura”.
- [x] T029 Card rich recolhido implementado com actor, prévia, estados/lifecycle/contadores, badges visuais e contagem de engajamento (olho + contagem).
- [x] T030 Completar filtros combináveis por tipo, tipo de atividade, criador e período, além dos atalhos.
- [x] T031 Mostrar badge `Ao vivo` somente após `connected` e indicar fallback automático quando desconectado.
- [ ] T032 Notificar primeira abertura/clique/reply/bounce/complaint com dedupe, audiência por owner/tenant e preferências.
- [x] T033 Frontend tests de render, filtros, loading/error, cards, estado socket/poll/reconnect e notificações (2/2 PASS em Jest).

## Phase 6 — privacidade, observabilidade e gates

- [x] T034 Novos eventos de pixel/link não armazenam IP/UA em texto puro (LGPD compliant com hashing e classificação).
- [x] T035 Diagnóstico de configuração de tracking/SNS/SES/ActionCable adicionado ao health endpoint (`check_email_tracking`).
- [ ] T036 E2E automatizado com mailbox/provider sintético para envio, eventos, timeline e cursor; não chamar provider real em CI.
- [x] T037 Validar migration up/down e regressões backend/frontend em ambientes de teste confirmados.
- [x] T038 Rodar CI completo local e corrigir gates críticos (RSpec: 9/9 PASS, Jest: 2/2 PASS, Typecheck: 0 erros).
- [ ] T039 Executar staging E2E com mailbox permitida, AWS/SNS reais e `/cable`; coletar medições p95 e evidências.
- [ ] T040 Confirmar Nginx realmente instalado, `EMAIL_TRACKING_HOST` em backend/worker e readiness/smoke; sem deploy automático.
- [ ] T041 Marcar gates operacionais somente com evidência registrada em [go-live-checklist.md](go-live-checklist.md).

## Dependências

T001–T005 antes de migrations/provider choices; T006–T014 antes de UI; T015–T020 antes do delta; T003 bloqueia T021/T022 de provider real; T023–T027 dependem de auth/cable; T028–T033 dependem de DTO; T039/T040 dependem de operador, secrets, mailbox e infraestrutura staging.
