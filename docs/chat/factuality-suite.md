# Factuality Suite

Dataset fica em `AB0-1-back/spec/fixtures/chat/factuality.yml`.

Casos cobrem ranking orgânico, fronteira CRM, planos e entitlements. Suite valida estrutura do dataset no CI; testes de resposta devem usar provider mockado e contexto real de registry/entitlement, nunca provider externo.

Gate recomendado:

```bash
bundle exec rspec spec/services/chat/factuality_suite_spec.rb
```
