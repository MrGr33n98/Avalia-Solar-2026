# Plano de Migração & Backfill — Spec 005

## 1. Migration Reversível: `primary_category_id`
- **Arquivo:** `AB0-1-back/db/migrate/20260926000000_add_primary_category_to_companies.rb`.
- **Definição:**
```ruby
# frozen_string_literal: true

class AddPrimaryCategoryToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_reference :companies, :primary_category, foreign_key: { to_table: :categories }, index: true
  end
end
```
- **Propriedades:**
  - Nullable: Não bloqueia writes em produção nem exige locks prolongados.
  - Indexada: Para consultas eficientes de filtragem e joins.
  - Foreign Key: Garante integridade referencial com a tabela `categories`.
  - Reversível: `change` executa `remove_reference` automaticamente em `db:rollback`.

---

## 2. Regras de Backfill Determinístico (Zero Adivinhação)

O backfill é executado de forma auditável e idempotente através de script ou rake task:

1. **Empresas com exatamente 1 categoria associada:**
   - Como a empresa só atua em uma vertical única comprovada, atribui-se deterministicamente:
     `company.update_columns(primary_category_id: company.categories.first.id)`.
2. **Empresas com 2 ou mais categorias associadas:**
   - **NÃO** escolher arbitrariamente `categories.first`.
   - Manter `primary_category_id = NULL`.
   - Gerar relatório diagnóstico listando as empresas que precisam selecionar sua vertical prioritária no dashboard ou ter escolha manual pelo admin.
3. **Empresas sem nenhuma categoria:**
   - Manter `primary_category_id = NULL`.

---

## 3. Fases de Rollout (Expand-and-Contract)
1. **Fase 1 (Expand):** Executar migration no backend; serializers expõem `identity.primary_category` e `commercial_status`, mantendo campos legados como fallback de compatibilidade.
2. **Fase 2 (Migrate Consumers):** Frontend e Mobile migram seus componentes para ler o contrato unificado.
3. **Fase 3 (Contract):** Após estabilidade de produção comprovada, os campos e métodos legados são descontinuados.
