# Status de implementação CRM V3

## Concluído nesta etapa

- Fundação de dados explícita para taxonomias, custom fields, notas, auditoria,
  API keys, produtos, itens de oportunidade, energia solar e tracking.
- Conexão de todas as rotas da API V3 no `config/routes.rb` sob `/api/v1/sales`.
- `Sales::CustomFieldDefinitionsController` implementado com suporte a CRUD de definições de campos customizados.
- Modelos Rails e validações básicas.
- Serviço determinístico de estimativa solar.
- Registro de auditoria reutilizável.
- Controllers de notas, propostas (quotes), API keys, integrações, webhooks, rbac, formulários e tracking ativados.
- Specs de requisição RSpec criadas para `taxonomies`, `custom_field_definitions`, `api_keys`, `quotes` e `notes`.
- Validação no gate `scripts/check-sales-zero-mock.sh` executada com sucesso (PASS).

## Pendências para Ambiente de Staging / Prod Completo

- Executar suite RSpec com banco PostgreSQL e Redis ativos (`docker compose exec backend bundle exec rspec`).
- Cobrir testes E2E Playwright e regressão visual com instâncias de backend rodando.
- Executar staging smoke test pós-deploy.

## Gate

- `scripts/check-sales-zero-mock.sh`: **PASS** (Zero-mock verificado).

