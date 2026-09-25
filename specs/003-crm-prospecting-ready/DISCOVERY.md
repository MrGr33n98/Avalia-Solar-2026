# Discovery — CRM Prospecting Ready

Data da inspeção: 2026-09-25
Branch: `feat/crm-prospecting-ready`
HEAD: `e7f9e91da31382d9c5fe64dbd0989a208d2cf206`

## Escopo e método

Inventário feito no código presente no working tree, incluindo alterações locais do Gate 0. Os arquivos de `specs/002-crm-tenant-integrity/` existem nesta branch e não foram recriados. O working tree já estava sujo antes desta etapa; as alterações locais devem ser preservadas. Nenhuma conclusão de readiness decorre da mera presença de classes ou rotas.

O workflow instalado `speckit-tasks` foi consultado. A configuração `.specify/extensions.yml` não existe. O script requerido por essa skill, `.specify/scripts/python/setup_tasks.py`, também não existe neste checkout; a lista de tarefas será mantida no formato Spec Kit exigido, com base neste inventário e no requisito do usuário.

## Inventário confirmado

### Backend — entidades e fluxo comercial

- Models Sales encontrados para campaigns/recipients, audiences, email messages/threads/events/templates/signatures, email sequences/steps, tasks/activities, accounts/contacts/opportunities, tracking sessions/events, consent e email suppressions.
- Serviços encontrados: `Sales::TenantScope`, `Sales::RevokeConsent`, `Sales::Campaigns::{AudienceResolver,Preflight,SnapshotService,Dispatcher,MetricsCalculator,AttributionResolver}`, e serviços `Sales::Messaging` para renderização, supressão e provider SES.
- Jobs encontrados: `Sales::SendEmailJob`, `Sales::CampaignSchedulerJob` e `Sales::CampaignBatchProcessorJob`.
- Controllers e rotas Sales cobrem campanhas, destinatários, templates, sequências, e-mails/eventos, consentimentos/revogações, tarefas/Today, tracking e attribution.
- Policies Sales e request/service/job specs existentes foram localizados; a extensão e a execução completa da suíte ainda precisam ser verificadas.

### Frontend — superfícies localizadas

- O CRM inicia em `AB0-1-front/app/dashboard/sales/page.tsx` e `SalesCommandCenter`.
- Foram localizadas páginas para Today, leads, pipeline, campanhas, e-mails, relatórios/attribution e configurações de e-mail, além de componentes de wizard de campanha e envio individual.
- Inventário de contratos por tela, estados e cobertura de frontend E2E ainda pendente.

## Bloqueios e evidências atuais

| Área | Evidência no working tree | Avaliação inicial |
| --- | --- | --- |
| Consent revocation | Baseline: `config/routes.rb` declarava `POST consent_revocations` com action `create`; controller só definia `update`. Após discovery, o POST foi alinhado a `update`; controller resolve Consent pelo conjunto de contacts em `current_tenant_scope`; service é idempotente e não audita repetição. Existe também rota PATCH aninhada no initializer. | **Correção local aplicada; ainda sem execução de request suite**: faltam request specs válidos/inexistentes/cross-tenant/sem autorização e prova de suppression imediata. |
| Today | `TodayController#index` inicia tarefas e oportunidades em `current_tenant_scope`, protegendo o isolamento de tenant. A consulta atual não filtra vendedor por owner e mostra todo o escopo do tenant. | **P0 parcialmente fechado pelo Gate 0**: isolamento tenant presente; fila padrão “minha fila” e regras de manager ainda não comprovadas. |
| Tracking público | Baseline: `TrackingSessionsController` e `TrackingEventsController` ignoravam autenticação e aceitavam IDs internos. Correção de contenção local: endpoints agora exigem Sales auth; sessão resolve Account/Contact scoped e gera `session_id` no servidor; evento deriva relações da sessão, usa allowlist, limite de payload, remoção de query da path e filtragem básica de chaves PII em properties. | **Contenção aplicada; web tracking público ainda BLOCKED**: falta chave pública opaca associada a tenant, origem permitida e persistência tenant-aware de visitantes anônimos. Não afirmar que tracking web está pronto. |
| Tracking identity | Baseline carregava sessão global por `session_id`; agora lookup exige Account no tenant atual antes de associar Contact. | Correção local aplicada, ainda sem request specs adversariais/execução. |
| Email → opportunity | `EmailsController#create` resolve opportunity via `current_tenant_scope.opportunities.find_by`; contacts/accounts também usam escopos e as relações são validadas. | Correção central do IDOR parece presente no working tree do Gate 0; conferir specs e a semântica da associação antes de fechar. |
| Email dispatch | `EmailsController#create` persiste `queued` em transação e enfileira job depois; possui fallback inline controlado por variáveis e fallback inline em erro de enfileiramento. `SendEmailJob` checa suppression no envio, chama Renderer e provider SES, persiste `sent`/falha e Activity. | Caminho de código existe; provider aceito, entrega, eventos, retry seguro e política de job não exercitados. Risco de fallback inline em erro Sidekiq e erro persistido sem retry efetivo requer tratamento. |
| Provider health | `Campaigns::Preflight` considera provider “configured” quando existem credenciais AWS, e retorna “unverified” caso contrário. Em test, provider é tratado como configurado. | **P1 confirmado**: presença de credenciais não comprova validade, identidade, sandbox/quota ou envio operacional; preflight de teste não serve como prova de readiness. |
| Campaigns | Há preflight, audience resolver, snapshot, dispatcher com lock, scheduler e batch job. Snapshot guarda template e recipients por campanha/email. O batch job chama `SendEmailJob.perform_now` por recipient. | Fluxo parcial já implementado; testar atomicidade, escopo tenant, dedupe, lock fail-open quando Redis indisponível, estado final/métricas, kill switch e limites. |
| Cadências | `EmailSequence` e `EmailSequenceStep` são definições com steps aninhados. A busca no código não localizou entidade de enrollment, scheduler ou processor de sequência. | **P1 confirmado**: execução/enrollment/auto-stop/integração Today não comprovados e aparentam ausentes. |
| Reply/inbound | Modelos de thread/message têm campos relacionados a `in_reply_to`/`references_header`; nesta etapa não foi localizada prova de provider inbound operacional nem de parada automática por resposta. | **Gate externo/código pendente**: investigar inbox/provider antes de desenhar integração. |
| Attribution/tracking | Controllers/models/resolver existem, mas tracking público não carrega atribuição verificável de forma segura. | Implementação e retenção first/last touch precisam de teste integrado do evento ao lead/opportunity e analytics. |
| RBAC/auditoria | Policies, authorization service e audit recorder existem no repositório e há mudanças locais de tenant do Gate 0. | Matriz granular para campanhas, email, sequências, analytics e reatribuição ainda precisa ser provada por request specs. |

## Riscos de integração externa

- Nenhum envio a SES/provider foi executado nesta discovery.
- Valores de secrets não foram lidos nem exibidos. A disponibilidade e o estado SES (credenciais, identidade, sandbox, quota e região) permanecem **não verificados**.
- Nenhum contato real foi usado. Não há prova atual de delivery, bounce, complaint, webhook autenticado ou resposta inbound.
- Nenhum banco de produção foi acessado. A execução da suíte Sales completa e o E2E em ambiente isolado ainda estão pendentes.

## Próximas investigações antes de fechar os gates

1. Verificar headers/assinatura SNS, confirmação de subscription, idempotência/replay e persistência do webhook de e-mail.
2. Confirmar constraints/índices no schema de tracking, campanhas e mensagens; localizar throttling/CORS e limites existentes.
3. Inspecionar schedules reais de Sidekiq, configuração de filas, política de retries e health/readiness.
4. Confirmar regras de ownership e permissões Today/tasks/RBAC com models, policies e specs adversariais.
5. Auditar forms públicos, tracking identity, dedupe/consent e atribuição first/last touch.
6. Mapear telas, clientes API e testes Playwright/Jest para todos os estados operacionais.
7. Executar specs Sales completos apenas em banco de teste isolado e, depois, E2E sintético em staging/provider permitido.

## Atualização após implementação — 2026-09-25

- `POST consent_revocations` agora aponta para `update`; request specs cobrem sucesso, repetição idempotente, tenant cruzado/inexistente e falta de autorização.
- Today passou a filtrar owner para vendedor por padrão; regra de time requer permissão explícita. A suíte não cobre toda a matriz manager/admin.
- Tracking sessions/events internos passaram a exigir autenticação Sales; session id é criado no servidor e event relation é derivada da session. Tracking web anônimo foi fechado até existir chave pública/origin e resolução tenant server-side.
- Forms ganharam `public_key` URL-safe aleatória, única e não nula. `show/submit` resolvem pela chave, limitam payload/fields, herdam campaign do form, fazem dedupe e têm Rack::Attack. Submission não cria lead/contact; consent/captcha e conversão permanecem pendentes.
- SES preflight passou a depender de `HealthCheck` e `SALES_EMAIL_SENDING_ENABLED`; kill switch protege envio individual, campanha e cadência. A conta externa SES não foi consultada nesta execução.
- Webhook SNS valida assinatura, topic, timestamp e certificado; token de unsubscribe é assinado, tem purpose/expiry e GET não altera suppression.
- Cadências ganharam enrollment/step execution persistente, scheduler por minuto, passos email/task/call_task e tela de enrollment/pausa/retomada/parada. `replied` é reconhecido pelo processor, mas não foi encontrada infraestrutura inbound que gere evento confiável.
- Migrations `20260925090000_create_sales_email_sequence_enrollments.rb` e `20260925100000_add_public_key_to_sales_forms.rb` foram aplicadas somente ao PostgreSQL descartável de teste. `db/schema.rb` foi regenerado; nenhum banco produtivo recebeu escrita.
- A suíte conjunta Sales (requests, services, jobs, models, queries, policies, unsubscribe) passou com **269 exemplos, 0 falhas**. `npm run typecheck` e `npx eslint app/dashboard/sales/campaigns/sequences/page.tsx` passaram. `npm run lint -- --file ...` percorreu o monorepo e falhou por erros externos à tela alterada.

## Bloqueios restantes

1. SES real, mailbox/simulator, delivery/bounce/complaint autenticados e campanha de staging não foram executados; G2/G3 continuam abaixo de PASS.
2. Nenhuma integração inbound operacional de reply foi localizada; auto-stop por resposta não pode ser declarado pronto.
3. Tracking web anônimo agora existe por chave/origin tenant-scoped e request specs; falta E2E browser/staging e respeitar preferência/consentimento de coleta do site integrador.
4. Forms aceitam submissions seguras mas não criam Lead/Contact nem convertem para Opportunity; first/last touch até opportunity/won não existe.
5. E2E Playwright de prospect→Kanban→Today→email/campanha/cadência/reply/analytics não foi executado.
6. Quotas/caps de envio e lock de campanha fail-closed com Redis indisponível não foram concluídos.

Os artifacts finais e os estados por gate estão em `TASKS.md`, `TEST_MATRIX.md` e `GO_LIVE_CHECKLIST.md`. Nenhum resultado acima substitui provider/E2E real.

## Atualização posterior — tracking web tenant-scoped

Em continuação da execução, o tracking público foi implementado em boundary separado dos endpoints internos:

- `Sales::TrackingSite` guarda uma public key server-generated e origins exatas por Company. A API autenticada `tracking_sites` exige `settings.manage`; rotação invalida a chave anterior.
- `GET /api/v1/public/sales/tracking/:key.js` serve o snippet; sessions/events públicos validam tenant/origin e criam IDs anônimos no servidor.
- CORS do endpoint público consulta a chave ativa e allowlist no banco, sem wildcard nos demais endpoints da API.
- Eventos públicos limitam-se a page/company views, CTA, quote request e form events; `email_opened`, `lead_converted` e eventos de oportunidade só podem ser internos. UUID único por tenant/session deduplica replay. Payload até 16 KB, path sem query, properties sanitizadas e IP não é persistido.
- Sessões/eventos agora contêm company_id e dados de landing/referrer host/classificação; identity autenticada liga session/eventos ao Contact. Não há conversão automática de form/visitor para Lead.
- UI real de tracking carrega/salva origens e chave, gera snippet retornado pelo backend, permite rotação e envia os parâmetros corretos para identity; não usa mais pixel/domínios hardcoded.
- Requests testam origem permitida/negada, CORS preflight, script, sessão, evento idempotente, payload, sessão cross-tenant, config cross-tenant e identity; **279 exemplos Sales passaram, 0 falhas**. TypeScript e ESLint focado passaram.

G5 agora é PARTIAL, não BLOCKED. Permanecem pendentes browser/staging E2E, rate limit compartilhado (Rack::Attack está em MemoryStore), attribution first/last persistente e vínculo a Lead/Opportunity/Won. A migration `20260925110000_create_sales_tracking_sites_and_public_sessions.rb` foi aplicada apenas em PostgreSQL descartável.
