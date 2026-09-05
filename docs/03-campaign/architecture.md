# Bounded Context Marketing Workspace Architecture — Avalia Solar CRM

> **Status:** Aprovado & Implementado  
> **Diretório:** `docs/03-campaign/`  
> **Data:** Setembro 2026

---

## 1. Visão Geral do Bounded Context

O **Marketing Workspace** do Avalia Solar CRM foi projetado como um **Bounded Context Orquestrador** desacoplado, sem duplicar o domínio de vendas canônico. Ele estende a infraestrutura de comunicação pré-existente integrando audiências dinâmicas, disparos idempotentes em lotes, rastreamento de eventos de e-mail e atribuição de receita direta a oportunidades ganhas.

```
 +------------------+       +-------------------+       +---------------------------+
 |  Sales::Account  |       |  Sales::Contact   |       |    Sales::Opportunity     |
 +--------+---------+       +---------+---------+       +-------------+-------------+
          |                           |                               |
          +-------------+-------------+                               |
                        |                                             |
                        v                                             v
            +-----------------------+                    +--------------------------+
            | Sales::Campaign       |                    | AttributionResolver      |
            | (Audience Filter)     |                    | (Won Deals Attribution)  |
            +-----------+-----------+                    +--------------------------+
                        |
                        v
            +-----------------------+
            | Recipient Snapshot    |
            | (CampaignRecipient)   |
            +-----------+-----------+
                        |
                        v
            +-----------------------+
            | Dispatcher & Jobs     |
            | (Sidekiq Batches)     |
            +-----------+-----------+
                        |
                        v
            +-----------------------+
            | Sales::EmailMessage   | ---> SES Provider / Webhooks
            | & EmailEvents         |
            +-----------+-----------+
                        |
                        v
            +-----------------------+
            | Daily Rollup Metrics  |
            | (CampaignDailyMetric) |
            +-----------------------+
```

---

## 2. Fluxo Orquestrado End-to-End

1. **Audience Resolution (`Sales::Campaigns::AudienceResolver`)**:
   - Resolve contatos ativos por tag, status ou busca textual.
   - Aplica filtros de segurança LGPD (`opt_out = false`) e supressão de e-mails ativas (`Sales::EmailSuppression`).
2. **Recipient Snapshot (`Sales::Campaigns::SnapshotService`)**:
   - Cria registros imutáveis em batch na tabela `sales_campaign_recipients`.
   - Congela `email`, `contact_id` e estado inicial (`pending`).
3. **Dispatch & Rate Limiting (`Sales::Campaigns::Dispatcher`)**:
   - Fraciona destinatários pendentes em lotes de 100 registros.
   - Enfileira `Sales::CampaignBatchProcessorJob` no Sidekiq (`queue: :mailers`).
   - Respeita trava distribuída no Redis (`campaign:dispatch_lock:<id>`).
4. **Messaging & Delivery (`Sales::SendEmailJob`)**:
   - Processa o disparo via AWS SES.
   - Gera instâncias de `Sales::EmailMessage` vinculadas à campanha e destinatário.
5. **Metrics & Rollup (`Sales::Campaigns::MetricsCalculator`)**:
   - Consolida taxas de entrega, abertura, clique, bounce e descadastro sem full scan repetido, gravando em `sales_campaign_daily_metrics`.
6. **Attribution (`Sales::Campaigns::AttributionResolver`)**:
   - Atribui valor de oportunidades ganhas (`Sales::Opportunity` no estágio `won`) aos destinatários impactados por campanhas nos últimos 30 dias.

---

## 3. Garantias de Performance e Escalabilidade

- **Zero N+1 Query**: Todas as listagens de campanhas e detalhes de destinatários utilizam `includes(:account, :contact, :email_messages)` e contadores denormalizados.
- **Rollup Tables**: Painéis analíticos consultam exclusivamente a rollup table `sales_campaign_daily_metrics` em agregados diários.
- **Transações em Lote**: Snapshotting via `insert_all` direto no PostgreSQL.
