# Discovery: Marketing Workspace — Avalia Solar CRM

## 1. Mapeamento do Código Existente

### Models Canônicos (`AB0-1-back/app/models/sales/`)
- `Sales::Account` (`sales_accounts`): Modelo central de empresa/conta.
- `Sales::Contact` (`sales_contacts`): Modelo de decisores/contatos. Possui `email`, `first_name`, `last_name`, `phone`, `company_id`, `sales_account_id`.
- `Sales::Opportunity` (`sales_opportunities`): Oportunidades comerciais e contratos.
- `Sales::Campaign` (`sales_campaigns`): Tabela existente com `company_id`, `name`, `source`, `medium`, `campaign_key`, `active`.
- `Sales::EmailMessage` (`sales_email_messages`): Mensagens de e-mail enviadas/recebidas (`status`, `from_email`, `to_email`, `subject`, `body_html`, `tracking_token`, `provider_message_id`).
- `Sales::EmailEvent` (`sales_email_events`): Eventos de webhook/tracking (`event_type`, `provider_event_id`, `occurred_at`, `payload`).
- `Sales::EmailLink` (`sales_email_links`): Links para click tracking (`token`, `original_url`, `click_count`).
- `Sales::EmailTemplate` (`sales_email_templates`): Modelos de e-mail (`name`, `subject_template`, `body_html`, `body_json`, `category`).
- `Sales::EmailSuppression` (`sales_email_suppressions`): Lista de opt-out/bounce (`company_id`, `email`, `reason`).
- `Sales::EmailSequence` (`sales_email_sequences`): Sequências automatizadas (`name`, `active`, `steps`).
- `Sales::EmailSequenceStep` (`sales_email_sequence_steps`): Etapas da sequência (`position`, `delay_days`, `email_template_id`).

### Infraestrutura de Disparo & Serviços (`AB0-1-back/app/services/sales/messaging/`)
- `Sales::Messaging::Providers::Ses`: Provedor AWS SES para envio de e-mails via SDK/API.
- `Sales::Messaging::Renderer`: Renderizador de templates com Fail-Closed.
- `Sales::Messaging::SnsMessageVerifier`: Autenticação e verificação de assinaturas de webhooks AWS SES/SNS.
- `Sales::SendEmailJob`: Job Sidekiq para envio assíncrono de mensagem individual.

---

## 2. Lacunas e Necessidades de Arquitetura

1. **Audience Engine**:
   - Falta resolvedor de audiência dinâmico (`AudienceResolver`) baseado em filtros flexíveis (ex: segmento da empresa, localização, estágio da oportunidade, consentimento LGPD, opt-out).

2. **Recipient Snapshot (`Sales::CampaignRecipient`)**:
   - Campanhas exigem congelamento dos destinatários (`sales_campaign_recipients`) para garantir idempotência, controle de lote, pause/resume, retry e observabilidade por destinatário.

3. **Orquestrador de Campanhas (`Sales::Campaigns::Dispatcher`)**:
   - Disparo distribuído em lotes (batching via Sidekiq + Redis locks/counters).
   - Suporte a `draft`, `scheduled`, `dispatching`, `paused`, `completed`, `cancelled`.
   - Limite de taxa por provedor (provider throttling), controle de acúmulo (backpressure) e progresso em tempo real.

4. **Analytics & Attribution (`Sales::Campaigns::MetricsCalculator` & Rollup)**:
   - Rollup tables / relatórios em tempo real sem full-scan repetido.
   - Atribuição de receita (`AttributionResolver`) conectando envios de campanha a oportunidades ganhas (`won`).

5. **API REST / Pundit / Routes**:
   - Endpoints REST tenant-scoped sob `api/v1/sales/campaigns`, `audiences`, `templates`, `sequences`, `analytics`.
   - Policies Pundit com RBAC e isolamento multi-tenant.
