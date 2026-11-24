# Modelo de Dados e Contextos DDD — 018 MCP Interactive UI (R1)

Nenhuma nova tabela é necessária para **R1** (100% leitura sobre agregados existentes `Company`, `Category`, `Review`). Widgets nunca acessam ActiveRecord diretamente e todo payload público passa pelo gateway `Mcp::Public::OutputValidator`.

## Contextos Delimitados (Bounded Contexts R1)

| Bounded Context | Agregados / Value Objects Rails | Invariantes Públicas |
|---|---|---|
| **Catalog & Discovery** | `Company.active`, `Category.active`, `Cursor` | Apenas `status: 'active'`; ordenação via allowlist (`relevance`, `rating`, `review_count`); `limit` 1..20; `preload(:categories)` evita erro `PG::UndefinedFunction` em `json`. |
| **Coverage (Declarado)** | `Company#city`, `state`, `coverage_state_list`, `coverage_city_list` | `headquarters` nunca implica cobertura local; cobertura vazia é explicitada sem inferência. |
| **Reputation** | `Review.approved_only` | Somente avaliações aprovadas; `total_approved == 0` => `average_rating: nil` (nunca `0.0`); `sample_size` sempre explícito. |
| **Trust & Verification** | `Company#verified?` | `platform_verified` ou `unverified`; nunca implica endosso ou garantia de qualidade. |
| **Comparison** | `ComparisonService` (`2..3` IDs/slugs únicos) | `2` ou `3` empresas distintas ativas; ausência exibida como `"Não informado"` (`null`); proibido declarar vencedor. |
| **MCP Presentation** | `Mcp::Ui::ResourceRegistry`, `TextSummaryFormatter` | URIs versionadas `ui://avalia-solar/<surface>/v1.html`, MIME `text/html;profile=mcp-app`, envelope `schema_version: '1.0.0'`, `MAX_BYTES = 65_536`. |

## Contratos DTO Público (Read-Only R1)

Todos os tools mantêm o envelope canônico:
```json
{
  "schema_version": "1.0.0",
  "data_as_of": "ISO-8601 UTC",
  "source_type": "company_declared | platform_verified | review_aggregate | platform_derived | unknown",
  "data": {},
  "limitations": ["..."]
}
```
Adição retrocompatível em `public_company`: campo opcional `logo_url` (`string | null`, validado HTTPS ou `null`), mantendo todos os campos privados (`email`, `phone`, `cpf`, `cnpj`, `user_id`, `tenant_id`, `buyer_intent`) bloqueados por `OutputValidator::PRIVATE_KEYS`.

