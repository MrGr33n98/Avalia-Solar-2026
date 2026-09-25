# Tarefas — CRM Prospecting Ready

## Contexto e estado

Feature derivada do master execution prompt do usuário e da baseline em [DISCOVERY.md](DISCOVERY.md). Preflight Git foi concluído e a branch `feat/crm-prospecting-ready` foi aberta preservando as alterações locais do Gate 0. A discovery está documentada. A skill `speckit-tasks` não pôde usar seu script padrão porque `.specify/scripts/python/setup_tasks.py` não existe neste checkout; a lista segue o formato e a organização exigidos pela skill. Nenhuma tarefa aqui é evidência de implementação ou readiness.

## Dependências

```text
Fundação → US1 (segurança/consent/tracking) → US2 (email/provider/suppression)
         → US3 (campaign lifecycle) → US4 (cadências/reply/tasks)
         → US5 (tracking/attribution) → US6 (UX/analytics/readiness)
         → validação integral / staging / Go-No-Go
```

As histórias dependem da fundação e da integridade tenant. US3 depende de US2; US4 depende de US2 e US1; US5 depende de US1; US6 integra US1–US5. Não executar envio real antes de provider habilitado e mailbox/simulador de staging aprovado.

## Phase 1 — Setup e discovery

- [x] T001 Criar `specs/003-crm-prospecting-ready/README.md` com objetivo, escopo, evidências e links para os artifacts desta feature.
- [x] T002 Atualizar `specs/003-crm-prospecting-ready/DISCOVERY.md` após cada auditoria com evidência de rotas, schema, filas, UI e specs realmente inspecionados.
- [x] T003 Registrar contratos existentes e divergências em `specs/003-crm-prospecting-ready/API_CONTRACTS.md` usando `AB0-1-back/config/routes.rb` e controllers Sales atuais.
- [x] T004 Registrar entidades/constraints reais em `specs/003-crm-prospecting-ready/DATA_MODEL.md` a partir de `AB0-1-back/db/schema.rb` e models Sales.
- [x] T005 Documentar state machine real e limites de componentes em `specs/003-crm-prospecting-ready/ARCHITECTURE.md` após confirmar models/jobs/services existentes.

## Phase 2 — Fundacional

- [x] T006 [P] Inventariar configuração de filas, retries e scheduler em `AB0-1-back/config/sidekiq.yml`, `AB0-1-back/config/initializers/sidekiq.rb` e `AB0-1-back/config/schedule.yml` (ajustar aos caminhos existentes).
- [x] T007 [P] Registrar o preflight de ambiente sem imprimir valores secretos em `specs/003-crm-prospecting-ready/OPERATIONS.md`.
- [x] T008 Definir gate de execução local isolada para RSpec Sales e E2E em `specs/003-crm-prospecting-ready/TEST_MATRIX.md`; nunca apontar para banco de produção.
- [x] T009 Mapear rotas/componentes reais do CRM e estados de UX em `specs/003-crm-prospecting-ready/DISCOVERY.md`.

## Phase 3 — US1: limites tenant, autorização e privacidade (P0)

**Objetivo:** nenhum endpoint, lookup ou alteração comercial atravessa tenant; o padrão de Today respeita ownership e RBAC.

**Teste independente:** adversariais request specs para A/B, seller/manager/admin, consent inexistente/repetido e identidade pública sem chave válida.

- [x] T010 [US1] Corrigir `POST consent_revocations` para a action realmente implementada em `AB0-1-back/config/routes.rb` e manter erro estruturado em `AB0-1-back/app/controllers/api/v1/sales/consent_revocations_controller.rb`.
- [x] T011 [US1] Resolver Consent por contato e tenant autorizado antes de revogar em `AB0-1-back/app/controllers/api/v1/sales/consent_revocations_controller.rb` e `AB0-1-back/app/services/sales/revoke_consent.rb`.
- [x] T012 [US1] Tornar revogação idempotente, auditável e imediatamente efetiva contra envios em `AB0-1-back/app/services/sales/revoke_consent.rb` e `AB0-1-back/spec/services/sales/revoke_consent_spec.rb`.
- [x] T013 [US1] Completar casos válido, repetido, tenant A/B, inexistente e sem permissão em `AB0-1-back/spec/requests/api/v1/sales/consent_revocation_spec.rb`.
- [x] T014 [US1] Aplicar escopo “minha fila” para seller e regras manager existentes em `AB0-1-back/app/controllers/api/v1/sales/today_controller.rb` sem bypass global.
- [ ] T015 [US1] Testar Today para seller, manager e tenant A/B em `AB0-1-back/spec/requests/api/v1/sales/today_spec.rb` (seller/tenant cobertos; matrix manager ainda pendente).
- [x] T016 [US1] Remover IDs internos do contrato anônimo e resolver tenant/origem por chave opaca em `AB0-1-back/app/controllers/api/v1/public/sales/tracking_controller.rb`; endpoints internos permanecem autenticados.
- [x] T017 [US1] Aplicar limite de 16 KB, allowlist web, allowlist/sanitização de propriedades, UUID idempotente, rate limits IP/chave e não persistir IP em tracking público.
- [x] T018 [US1] Escopar identidade e sessão ao mesmo tenant em `AB0-1-back/app/controllers/api/v1/sales/tracking_identity_controller.rb`.
- [x] T019 [US1] Cobrir origem inválida, sessão cross-tenant, evento não permitido, duplicado, UUID e payload excessivo em `AB0-1-back/spec/requests/api/v1/public_sales_tracking_spec.rb` e `tracking_security_spec.rb`.
- [ ] T020 [US1] Completar testes para lookup de opportunity, contato/conta e relações de email tenant-safe em `AB0-1-back/spec/requests/api/v1/sales/emails_spec.rb`.

## Phase 4 — US2: envio individual confiável, provider, eventos e compliance

**Objetivo:** status corresponde ao resultado real do provider; supressão e eventos confiáveis bloqueiam envios indevidos.

**Teste independente:** provider fake apenas nos specs; contrato de staging separado usando inbox interna/simulador, sem prospects.

- [x] T021 [US2] Implementar estados de saúde do provider e kill switch no preflight em `AB0-1-back/app/services/sales/campaigns/preflight.rb` e serviços `AB0-1-back/app/services/sales/messaging/providers/`.
- [x] T022 [US2] Bloquear envio individual, campanhas e cadências quando `SALES_EMAIL_SENDING_ENABLED` estiver desligado em `AB0-1-back/app/jobs/sales/send_email_job.rb` e serviços de dispatch existentes.
- [x] T023 [US2] Persistir retry/falha sem fallback inline silencioso em `AB0-1-back/app/controllers/api/v1/sales/emails_controller.rb` e `AB0-1-back/app/jobs/sales/send_email_job.rb`.
- [x] T024 [US2] Validar SNS signature/topic/timestamp, confirmação, evento suportado e replay no endpoint efetivamente roteado em `AB0-1-back/app/controllers/api/v1/sales/ses_webhooks_controller.rb` e `AB0-1-back/app/services/sales/messaging/sns_message_verifier.rb`.
- [x] T025 [US2] Tornar email events idempotentes e tenant/provider-message scoped, sem armazenar payload sensível integral em `AB0-1-back/app/controllers/api/v1/sales/email_events_controller.rb` e models relacionados.
- [x] T026 [US2] Fechar unsubscribe por token assinado com propósito, preferências, suppression e stop de cadência em controllers/services de tracking, consentimento e email suppression existentes.
- [x] T027 [US2] Adicionar headers e URL de unsubscribe seguros ao renderer/provider em `AB0-1-back/app/services/sales/messaging/renderer.rb` e `AB0-1-back/app/services/sales/messaging/providers/ses.rb`.
- [ ] T028 [US2] Cobrir sucesso, falha, suppression no send time, retry, bounce, complaint, delivery e webhook forjado em specs request/job/service Sales.
- [x] T029 [US2] Registrar a validação real do provider e limites externos em `specs/003-crm-prospecting-ready/EMAIL_RUNBOOK.md` sem armazenar secrets (documentado como não exercitado).

## Phase 5 — US3: campanhas operacionais e idempotentes

**Objetivo:** snapshot imutável e dispatch deduplicado, limitado, pausável, retomável e mensurável.

**Teste independente:** campanha sintética de um destinatário permitido, double launch/tick/retry e recipient lifecycle.

- [ ] T030 [US3] Fechar elegibilidade, dedupe, motivos de exclusão e snapshot de recipient/template em `AB0-1-back/app/services/sales/campaigns/audience_resolver.rb` e `snapshot_service.rb`.
- [ ] T031 [US3] Fazer dispatch fail-closed quando lock/Redis estiver indisponível e aplicar limites por tenant/campanha antes de enfileirar em `AB0-1-back/app/services/sales/campaigns/dispatcher.rb`.
- [ ] T032 [US3] Garantir idempotência recipient→message→provider e revalidação de suppression no batch em `AB0-1-back/app/jobs/sales/campaign_batch_processor_job.rb`.
- [ ] T033 [US3] Confirmar transições auditáveis e completar/cancelar/pausar/retomar sem reenvio em `AB0-1-back/app/models/sales/campaign.rb` e `AB0-1-back/app/services/sales/campaigns/dispatcher.rb`.
- [ ] T034 [US3] Testar snapshot, double launch, scheduler duplicado, pause/resume/cancel/retry e completion em `AB0-1-back/spec/services/sales/campaigns/` e `AB0-1-back/spec/jobs/sales/`.
- [ ] T035 [US3] Fechar preflight e blockers do wizard em `AB0-1-front/components/sales/` e cliente/API Sales existente.
- [x] T036 [US3] Registrar limites e procedimento seguro de campanha em `specs/003-crm-prospecting-ready/CAMPAIGN_RUNBOOK.md`.

## Phase 6 — US4: cadências, enrollment, tarefas e parada por reply

**Objetivo:** sequência executa passos com agenda e estado persistentes, pausa diante de reply/suppression e cria tarefas Today.

**Teste independente:** enrollment sintético com email + tarefa; avanço após sucesso, retry idempotente e stop por reply/unsubscribe/bounce.

- [x] T037 [US4] Confirmar que não há entidade equivalente e, se ausente, implementar enrollment/step execution com constraints reversíveis em migrations `AB0-1-back/db/migrate/` e models `AB0-1-back/app/models/sales/`.
- [x] T038 [US4] Implementar scheduler/processor com lock tenant-aware, timezone operacional e avanço somente após sucesso em `AB0-1-back/app/jobs/sales/` e `AB0-1-back/app/services/sales/`.
- [x] T039 [US4] Implementar passos email/task/call_task e integração de task→Today em services/controllers Sales existentes.
- [ ] T040 [US4] Ligar reply inbound autenticado a EmailThread/Activity e auto-stop da enrollment reaproveitando inbox/provider existente em `AB0-1-back/app/controllers/` e `AB0-1-back/app/services/sales/`.
- [ ] T041 [US4] Aplicar stop por unsubscribe, hard bounce, complaint, desqualificação e resultado de opportunity definido pela regra atual em serviço de enrollment (reply inbound indisponível; desqualificação sem regra comprovada).
- [ ] T042 [US4] Cobrir enrollment concorrente, lock, step failure/retry, pausa, resume, reply e suppression em specs de jobs/services/requests Sales (reply não exercitado).
- [x] T043 [US4] Construir UX de definição, enrollment, estado, próxima ação e histórico em páginas/componentes CRM existentes de `AB0-1-front/app/dashboard/sales/` e `AB0-1-front/components/sales/`.
- [x] T044 [US4] Documentar operador e recuperação em `specs/003-crm-prospecting-ready/CADENCE_RUNBOOK.md`.

## Phase 7 — US5: tracking, formulários e attribution

**Objetivo:** visita anônima segura preserva first/last touch até lead/contact/opportunity e exclui tráfego interno de métricas comerciais.

**Teste independente:** eventos sintéticos duplicados, identidade resolvida e conversão atribuída com tenant isolado.

- [x] T045 [US5] Definir contrato de event allowlist e classificação interna em `specs/003-crm-prospecting-ready/TRACKING_RUNBOOK.md` a partir de eventos já usados no repositório.
- [ ] T046 [US5] Ligar sessão/evento a Contact por identity autenticada (implementado/testado); vínculo a Lead e conversão ainda pendente, sem confiar em IDs ou PII da URL.
- [ ] T047 [US5] Implementar first/last touch, source/medium/campaign/referrer/landing page com fallback `unknown/direct` no resolver real de `AB0-1-back/app/services/sales/campaigns/attribution_resolver.rb` ou equivalente existente.
- [ ] T048 [US5] Validar formulários públicos, public key, spam guard, dedupe e consent em controller/service real antes de associar lead ao tenant (public key, allowlist, limites e idempotência concluídos; spam/consent/lead creation pendentes).
- [ ] T049 [US5] Cobrir identidade, conversão, tráfego interno, atribuição e tenant A/B em `AB0-1-back/spec/requests/api/v1/sales/attribution_spec.rb` e specs de tracking.
- [x] T050 [US5] Documentar coleta, retenção e diagnóstico em `specs/003-crm-prospecting-ready/TRACKING_RUNBOOK.md`.

## Phase 8 — US6: operação CRM, analytics e experiência

**Objetivo:** equipe completa fluxos no UI e vê somente estados comprovados da API/provider.

**Teste independente:** UI para sucesso, vazio, carregamento, 403, 422, 500 e provider indisponível; pipeline e Today confirmados após reload.

- [ ] T051 [US6] Mapear navegação atual antes de mudanças e completar superfícies ausentes em `AB0-1-front/components/sales/SalesCommandCenter.tsx` e rotas existentes.
- [ ] T052 [US6] Corrigir UX Today para fila própria/filtros permitidos e estados de erro em página/componente de `AB0-1-front/app/dashboard/sales/today/`.
- [ ] T053 [US6] Fechar wizard de campaign com blockers, estimativas, warnings e estado provider real em `AB0-1-front/components/sales/`.
- [ ] T054 [US6] Exibir estados reais de email (sent separado de delivered, failed/suppressed/replied) em componentes e tipos Sales do frontend.
- [ ] T055 [US6] Fechar analytics com denominadores documentados e cardinalidade unique-recipient em `AB0-1-back/app/services/sales/campaigns/metrics_calculator.rb` e telas analytics existentes.
- [ ] T056 [US6] Adicionar logs estruturados com IDs operacionais sem PII, endpoint readiness Sales e alarmes acionáveis nos arquivos de observabilidade/jobs existentes.
- [ ] T057 [US6] Testar componentes/hooks/client API e E2E Playwright CRM nos fluxos prospect→pipeline→task→email→campaign→cadence.
- [ ] T058 [US6] Executar validações frontend `lint`, `typecheck`, testes focados e build compatíveis em `AB0-1-front/package.json` (typecheck e ESLint focado passaram; lint global tem erros fora do escopo e testes/build pendentes).

## Phase 9 — polish, suíte integral e Go/No-Go

- [x] T059 Executar suíte Sales RSpec completa em banco de teste isolado e registrar comando/resultado em `specs/003-crm-prospecting-ready/TEST_MATRIX.md`.
- [ ] T060 Executar E2E com dados sintéticos em staging/inbox permitido e preencher evidências em `specs/003-crm-prospecting-ready/GO_LIVE_CHECKLIST.md`.
- [x] T061 Atualizar status G0–G9 com `PASS`, `PARTIAL`, `BLOCKED` ou `FAIL` e evidência por gate em `specs/003-crm-prospecting-ready/GO_LIVE_CHECKLIST.md`.
- [x] T062 Publicar procedimentos operacionais, rollback, pausa e limites seguros em `specs/003-crm-prospecting-ready/OPERATIONS.md`.
- [ ] T063 Revisar `git status`, diff, migrations e ausência de secrets/PII no working tree antes do handoff.

## Estratégia de entrega

MVP de segurança: concluir US1 (P0), com regressão adversarial e sem iniciar envio. MVP comercial controlado: US2 + US3 com provider de staging comprovado e limite inicial de destinatários. US4 e US5 são necessários para afirmar operação completa de follow-up e attribution. Só então US6, suíte integral e gates E2E/Go-No-Go podem liberar prospecção no escopo efetivamente comprovado.

## Oportunidades independentes

- T001–T005 são artifacts/documentação independentes após a discovery base.
- T006–T009 podem ser investigadas em paralelo, cada uma em arquivo distinto.
- Dentro de US1, os specs de Today, tracking público e consent podem avançar em paralelo após os contratos de escopo estarem definidos.
- US2 depende de US1 para suppression e privacidade; US3 depende de provider health e suppression; US4 depende de send/email event e inbound; US5 depende do boundary público de US1.
- A validação completa e staging são sequenciais após as histórias integradas.
