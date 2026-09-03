# CRM Query Count Matrix

## Auditoria de Contagem de Queries SQL no Backend

| Ação Backend | Query Count Antes | Query Count Depois | Explicação da Otimização |
| --- | --- | --- | --- |
| `POST /api/v1/sales/opportunities` | 14 queries | 5 queries | Transação atômica em `Sales::Opportunities::Create`, sem `ensure_default_stages!` no hot-path |
| `GET /api/v1/sales/accounts?options=true` | 8 queries (com includes) | 1 query | `Sales::AccountOptionsQuery` usa `.select(:id, :name, :domain)` direto |
| `GET /api/v1/sales/contacts?options=true` | 12 queries (resolvers) | 1 query | `Sales::ContactOptionsQuery` usa `.select(...)` direto sem instanciar resolvers de último contato |
