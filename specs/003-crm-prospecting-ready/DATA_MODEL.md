# Dados do CRM Prospecting Ready

## Cadências adicionadas

Migration `20260925090000_create_sales_email_sequence_enrollments.rb` cria:

- `sales_email_sequence_enrollments`: tenant/company, sequence, contact, account, opportunity opcional, owner, status, etapa atual, datas de enrollment/próxima ação/pausa/stop/conclusão e metadata.
- `sales_email_sequence_enrollment_steps`: execução por enrollment/definition step, posição, status, tentativas, próximo retry, conclusão e código de erro.
- FK opcional em `sales_email_messages` e `sales_tasks` para ligar cada execução à mensagem/tarefa criada.

Constraints/índices incluem FKs para tenant e registros referenciados, unicidade de enrollment ativo/pausado por sequence/contact, unicidade de step por enrollment e uma mensagem/tarefa por execução de step. A migration foi aplicada no banco temporário `avalia_solar_test`; não em produção.

Migration `20260925100000_add_public_key_to_sales_forms.rb` adiciona chave URL-safe aleatória, não nula e globalmente única em `sales_forms`; forms existentes recebem valor no backfill. Submissions públicas não criam Lead ou Contact automaticamente.

Migration `20260925110000_create_sales_tracking_sites_and_public_sessions.rb` adiciona `sales_tracking_sites` (uma configuração por Company, public_key aleatória, origens exatas, active), `company_id/referrer_host/landing_path/traffic_class` às sessões e `company_id/event_uuid` aos eventos. IDs de tenant existentes são preenchidos usando Account/Contact; sessões anônimas novas recebem `company_id` resolvido pela `public_key`. UUID tem unique index parcial por tenant/session para dedupe. Campos novos em sessions/events aceitam NULL para preservar linhas legadas.

## Estados de enrollment

`active`, `paused`, `completed`, `stopped`, `failed`. Steps: `queued`, `task_pending`, `completed`, `failed`. Stops são persistidos com motivo, incluindo `manual_stop`, `unsubscribe`, `suppressed`, `opportunity_won` e `opportunity_lost` quando observado no processamento.

## Modelos reaproveitados

Campanha e contatos usam `Sales::Campaign/Recipient`, `Sales::Audience`, `EmailTemplate`, `EmailMessage/Thread/Event`, `EmailSuppression`, `Task`, `Activity`, `Account`, `Contact`, `Opportunity`, `TrackingSession/Event` e `Consent` existentes.

## Observação de integridade

FKs garantem existência, mas não substituem validação de paridade de tenant. Controllers e services devem resolver entidades pelo `TenantScope`; acesso direto por ID não deve ser tratado como autorização.
