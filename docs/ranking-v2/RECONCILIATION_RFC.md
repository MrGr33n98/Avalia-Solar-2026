# RFC: Plano de Reconciliação de Cobertura e Estratégia de Migração (W3)

- **Status:** Proposta de Arquitetura (RFC) — NENHUMA ESCRITA AUTORIZADA NESTA FASE.
- **Autoridade:** ADR 0005 (Coverage Domain Boundary) e ADR 0006 (Identidade Territorial Canônica).
- **Objetivo:** Estabelecer o mapeamento de equivalência, estratégia de backfill idempotente e procedimento de rollback entre dados legados (`Company#coverage_states`, `Company#coverage_cities`) e a entidade canônica `CompanyServiceArea`.

---

## 1. Contexto e Diagnóstico Atual

Atualmente, existem duas fontes de verdade para o território de atendimento de uma empresa:
1. **Campos Legados (`Company`):**
   - `coverage_states`: array ou string delimitada por vírgula de UFs (ex: `["SP", "RJ"]`).
   - `coverage_cities`: array ou string delimitada por vírgula de nomes de cidades (ex: `["Campinas", "Santos"]`).
   - Não possuem tipagem relacional, histórico de modificação ou integridade referencial com códigos IBGE.
2. **Entidade Estruturada (`CompanyServiceArea`):**
   - Registros relacionais com `coverage_type`: `national`, `state`, `city`, `radius`.
   - Suporte a `is_active` (boolean) e `radius_km`.

---

## 2. Taxonomia de Classificação de Divergência

O `Coverage::ReconciliationClassifier` mapeia qualquer par de dados nas seguintes categorias mutuamente exclusivas:

| Categoria | Descrição | Tratamento Proposto no Backfill |
|---|---|---|
| `equal` | Ambas as fontes representam exatamente os mesmos estados e cidades. | Nenhuma ação necessária; estado já sincronizado. |
| `legacy_only` | Empresa possui estados/cidades legados, mas zero `CompanyServiceArea` ativos. | Criar registros equivalentes em `CompanyServiceArea` com `is_active: true`. |
| `relation_only` | Empresa possui registros ativos em `CompanyServiceArea`, mas campos legados vazios. | Manter `CompanyServiceArea` como verdade primária; opcionalmente sincronizar cache de texto se consumidores legados exigirem. |
| `divergent` | Ambas as fontes existem mas diferem em estados, cidades ou presença de tipo nacional/raio. | Não mesclar cegamente. Gerar fila de auditoria com diff explícito antes de qualquer migração. |
| `none` | Nenhuma cobertura cadastrada em nenhuma das fontes. | Empresa atende apenas a sede municipal (localidade primária). |

---

## 3. Regras de Equivalência e Invariantes

1. **Invariante de Raio:**
   - Raio (`coverage_type: 'radius'`) **nunca** deve ser convertido em lista arbitrária de cidades próximas sem coordenadas geodésicas reais e auditadas.
   - O novo `CoverageResolver` categoriza raio como `:unsupported` como prova territorial.
2. **Invariante de Homônimos:**
   - Cidades sem UF associada não podem ser migradas para o catálogo canônico sem desambiguação prévia pelo estado sede ou lista de estados autorizados da empresa.
3. **Invariante de Preservação de Tokens:**
   - Tokens desconhecidos ou strings JSON corrompidas no legado não devem ser silenciosamente descartados; devem ser logados em `unknown_tokens`.

---

## 4. Estratégia de Backfill Idempotente (Execução Futura)

Caso a liderança aprove a migração de dados no futuro, o script de backfill deverá seguir os seguintes passos sob transação:

```ruby
# Pseudo-código de migração futura
Company.transaction do
  # 1. Obter snapshot dos registros atuais em CompanyServiceArea
  # 2. Inserir registros de estado canônicos para legacy_only
  # 3. Inserir registros de município canônicos para legacy_only
  # 4. Registrar batch_id imutável para permitir rollback seletivo
end
```

---

## 5. Procedimento de Rollback

Se um backfill apresentar inconsistências:
1. Todo lote inserido deve possuir `source: 'migration_ranking_v2'` e `migration_batch_id`.
2. O rollback executa a exclusão lógica/física apenas dos registros vinculados àquele lote específico:
   ```ruby
   CompanyServiceArea.where(migration_batch_id: target_batch_id).delete_all
   ```
3. Os campos legados `coverage_states` e `coverage_cities` em `Company` permanecem **inalterados**, garantindo continuidade ininterrupta de todos os consumidores legados.
