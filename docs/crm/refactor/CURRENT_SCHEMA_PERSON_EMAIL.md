# Schema atual — Person e e-mail

Fonte: `AB0-1-back/db/schema.rb` e modelos Rails.

- Pessoa: `sales_contacts`, associada a `company`, `account`, owner, employments, activities, tasks e opportunity contacts.
- E-mail: `sales_email_messages`, associado a company, account, contact, opportunity, sender, account/thread, participants, attachments, events e links.
- Evento: `sales_email_events`, `event_type`, `occurred_at`, `provider_event_id`, payload e relação por `sales_email_message_id`.
- Template: `sales_email_templates`, body JSON/HTML, subject, category e visibilidade por `user_id` nulo ou do usuário.
- Pipeline: `Sales::SendEmailJob` envia via SES V2; webhook SNS localiza por `provider_message_id`.

Não foram adicionadas tabelas nesta fase.
