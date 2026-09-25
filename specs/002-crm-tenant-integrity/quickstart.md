# Quickstart Validation Guide: CRM Tenant Isolation & Referential Integrity

**Spec**: `specs/002-crm-tenant-integrity/spec.md`

## Test Execution Guidelines

1. **Environment Check**: Ensure `RAILS_ENV=test` and database is isolated before running specs.
2. **Adversarial Setup (Tenant A vs Tenant B)**:
   - Create Tenant A (`Company A`, `User A`, `Account A`, `Contact A`, `Opportunity A`).
   - Create Tenant B (`Company B`, `User B`, `Account B`, `Contact B`, `Opportunity B`).

## Core Scenarios to Run

```bash
# Run RSpec CRM Tenant Isolation Suite
cd AB0-1-back
bundle exec rspec spec/requests/api/v1/sales/
```

### Verification Criteria

1. **User A Query Tenant B**: Expect HTTP `404 Not Found` (indistinguishable from nonexistent ID).
2. **Cross-Tenant Mutation (Account A + Opportunity B)**: Expect HTTP `422 Unprocessable Entity` or `404 Not Found`. Zero records created.
3. **Valid Intra-Tenant Mutation (Account A + Opportunity A)**: Expect HTTP `200 OK` / `201 Created`.
4. **Today Queue Isolation**: User A sees only tasks and opportunities belonging to Tenant A.

## Resultado desta execução

**Status de validação: PARTIAL.** O Gate 0 foi exercitado em banco de teste isolado; a suite completa Sales e os fluxos que poderiam entregar e-mail ou despachar campanhas não foram executados.

- Ambiente confirmado no Rails: `RAILS_ENV=test`, PostgreSQL, banco efetivo `avalia_solar_test`.
- O banco usado foi PostgreSQL temporário em `tmpfs`; o `schema.rb` foi carregado nele. Nenhum banco persistente de desenvolvimento/produção foi alterado.
- Specs focados e regressões selecionadas: **40 exemplos, 0 falhas**.
- Sintaxe Ruby de controllers, services e specs Sales: **Syntax OK**.
- A mutação de email com contato fora do tenant foi rejeitada com 404, sem criar `EmailMessage` e sem acrescentar job à fila de Active Job. Nenhum teste executado chamou `test_send`, provedor de email ou despacho de campanha.

Comando RSpec executado dentro da imagem backend de teste:

```bash
bundle exec rspec \
  spec/requests/api/v1/sales/tenant_isolation_read_spec.rb \
  spec/requests/api/v1/sales/referential_integrity_spec.rb \
  spec/requests/api/v1/sales/admin_boundaries_spec.rb \
  spec/services/sales/tenant_scope_spec.rb \
  spec/services/sales/leads/create_spec.rb \
  spec/requests/api/v1/sales/today_spec.rb \
  spec/requests/api/v1/sales/leads_spec.rb \
  spec/requests/api/v1/sales/notes_spec.rb \
  spec/requests/api/v1/sales/quotes_spec.rb \
  spec/requests/api/v1/sales/email_templates_preview_spec.rb \
  spec/requests/api/v1/sales/authorization_spec.rb \
  spec/requests/api/v1/sales/pipelines/boards_spec.rb
```

## Limites e follow-ups

- As rotas públicas de forms/tracking, operação de campanhas, tracking de produto e automações de follow-up permanecem fora do Gate 0; ver classificação e matriz de rotas em `spec.md`.
- O envio produtivo/deliverability não foi validado. Testes com efeitos de provider ou `test_send` precisam de ambiente e contrato próprios.
- A fila Today continua limitada ao tenant e mantém stale acima de cinco dias. A decisão de produto sobre carteira owner-only versus tenant-wide segue pendente no spec.
