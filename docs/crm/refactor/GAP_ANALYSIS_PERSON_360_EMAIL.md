# Gap analysis — Person 360 e e-mail

Auditoria baseada no código atual em 03/09/2026. Modelos canônicos existentes: `Sales::Contact`, `Sales::Account`, `Sales::Opportunity`, `Sales::EmailMessage`, `Sales::EmailEvent` e `Sales::EmailTemplate`.

| Current | Target | Gap | Files affected | Backend impact | Frontend impact | Migration impact | Test impact | Production risk | Acceptance test |
|---|---|---|---|---|---|---|---|---|---|
| Contact detail usa card espaçoso e timeline simples | Workspace denso com header, ações, navegação local e rail sticky | Shell e layout ausentes | `Person360FullView.tsx`, layout sales | Nenhum inicialmente | Alto | Nenhuma | RTL, Playwright | Médio, regressão visual | Header 52–60px, nav e rail sticky em desktop |
| `/contacts/:id/timeline` usa `TimelineBuilder` | Query unificada, filtros, paginação e DTO estável | Contrato incompleto | `contacts_controller.rb`, serviços Contacts | Alto | Médio | Índices conforme medição | Request/query | Médio | filtros retornam somente tenant e ordenação desc |
| EmailEvent já possui valores canônicos e webhook mapeia SES | Cobertura completa incluindo Send ignorado e desconhecido ignorado | Implementação aparenta pronta; confirmar specs | `ses_webhooks_controller.rb`, spec SES | Baixo | Nenhum | Nenhuma | Provider/request | Alto se alterado | Send não cria evento; DeliveryDelay preservado |
| Composer é modal de formulário básico | Composer de dois painéis, templates, editor, chips e assinatura | Geometria e recursos faltantes | `EmailComposerModal.tsx`, API client | Médio | Alto | Nenhuma | Jest/RTL/E2E | Alto no envio | envio mantém job SES e provider id |
| Templates têm CRUD básico e sem grupos/steps | Workspace com busca, grupos e editor | filtros, grupos e steps ausentes | controller/model/routes, settings UI | Médio/alto | Alto | Necessária após schema review | Request/model/RTL | Médio | CRUD tenant-safe e preview real |
| Engagement existe em EmailMessage/eventos | Card e timeline com open/click reais | DTO/agregação ausentes | email controller, timeline UI | Médio | Médio | Índices opcionais | Request/RTL | Médio | contagens vêm de eventos reais |
| Falha/suppression/unsubscribe não são workspace integrado | bloqueio fail-closed e folders operacionais | domínio/API ausente ou parcial | messaging, controllers, models | Alto | Médio | Necessária | service/request | Alto | bounce/complaint impedem envio |

## Prioridade

P0: preservar webhook/SES, documentar contratos, density primitives, shell Person 360, timeline real, composer sem regressão.

P1: engagement, templates workspace/groups, suppression e unsubscribe.

P2: steps, inbound, replies e engine de sequences.
