# C3 — Staging

O staging C3 ainda não foi provisionado nesta PR. Antes de habilitar as flags,
criar ambiente Rails/PostgreSQL/Redis separado, configurar HTTPS, allowlist de
host/origin e `MCP_PRIVATE_OAUTH_RESOURCE` com o domínio real do staging.

Validar authorization code + PKCE, token privado, metadata, membership,
entitlement, revogação, refresh e rollback. Não usar credenciais de produção.
