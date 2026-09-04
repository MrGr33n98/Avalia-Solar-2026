# Contrato API de e-mail

Existente: `POST /api/v1/sales/emails`, `GET /api/v1/sales/emails`, `GET /api/v1/sales/emails/:id`, CRUD de `/api/v1/sales/email_templates` e `POST /api/v1/sales/ses_webhooks`.

Regras: resposta de erro possui `error` e, quando aplicável, `code`; envio aceita contato canônico; `status=queued`; job é assíncrono; `provider_message_id` é persistido pelo job; eventos SNS são idempotentes por provider event id.

Extensões planejadas: engagement por contato, grupos/templates e failed/suppression. Nenhuma extensão deve trocar SES por SMTP ou aceitar IDs fabricados.
