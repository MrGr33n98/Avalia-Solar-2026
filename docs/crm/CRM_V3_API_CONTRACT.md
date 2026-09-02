# Contrato API CRM V3

Endpoints implementados sob `/api/v1/sales`: notes, taxonomies, products, quotes,
quote items, quote document, integrations, webhooks, API keys, tracking events,
tracking sessions, tracking identity, forms, consents, roles, user roles,
attribution e forecast.

Endpoints internos exigem autenticação e autorização Sales. Submissões públicas
aceitam `Idempotency-Key`. Segredos nunca são persistidos em texto puro.
