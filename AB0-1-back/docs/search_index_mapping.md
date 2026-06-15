# Mapeamento do Índice de Busca — Avalia Solar

## Motor de Busca: OpenSearch (Fase 3+)

### Índice: `avalia_solar_{env}_companies`

O índice principal de empresas será criado quando a Fase 3 for implementada.

---

## Mapeamento de Campos

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "integer" },
      "name": {
        "type": "text",
        "analyzer": "portuguese",
        "fields": {
          "keyword": { "type": "keyword" },
          "suggest": { "type": "completion" }
        }
      },
      "slug": { "type": "keyword" },
      "segment": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "portuguese" },
      "city": { "type": "keyword" },
      "state": { "type": "keyword" },
      "categories": { "type": "keyword" },
      "category_slugs": { "type": "keyword" },
      "services_offered": { "type": "keyword" },
      "project_types": { "type": "keyword" },
      "coverage_cities": { "type": "keyword" },
      "coverage_states": { "type": "keyword" },
      "rating_avg": { "type": "float" },
      "rating_count": { "type": "integer" },
      "is_verified": { "type": "boolean" },
      "is_featured": { "type": "boolean" },
      "is_sponsored": { "type": "boolean" },
      "plan_tier": { "type": "keyword" },
      "priority_score": { "type": "float" },
      "profile_completion": { "type": "float" },
      "location": { "type": "geo_point" },
      "active": { "type": "boolean" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

---

## Campos para `Company#search_data` (Searchkick)

```ruby
def search_data
  {
    id: id,
    name: name,
    slug: slug,
    segment: segment,
    description: description,
    city: city,
    state: state,
    categories: categories.map(&:name),
    category_slugs: categories.map(&:seo_url),
    services_offered: services_offered || [],
    project_types: project_types || [],
    coverage_cities: coverage_city_list,
    coverage_states: coverage_state_list,
    rating_avg: rating_avg.to_f,
    rating_count: rating_count.to_i,
    is_verified: verified?,
    is_featured: featured?,
    is_sponsored: respond_to?(:sponsored) ? sponsored : false,
    plan_tier: respond_to?(:inferred_plan_tier) ? inferred_plan_tier : 'free',
    priority_score: respond_to?(:priority_score) ? priority_score.to_f : 0.0,
    active: active_status?,
    created_at: created_at
  }
end
```

---

## Estratégia de Sincronização

| Evento | Ação |
|---|---|
| Company criada | Indexar após criação |
| Company atualizada | Reindexar assincronamente |
| Review aprovada | Reindexar company (nota muda) |
| Review removida | Reindexar company |
| Plano/Assinatura muda | Reindexar company |
| Verification status muda | Reindexar company |
| Sponsored status muda | Reindexar company imediatamente |

---

## Facetas Planejadas (Agregações)

```graphql
type SearchFacets {
  categories: [FacetItem!]
  states: [FacetItem!]
  cities: [FacetItem!]
  services: [FacetItem!]
  ratings: [RatingFacet!]
  verified_count: Int
  sponsored_count: Int
}

type FacetItem {
  name: String!
  count: Int!
}
```

---

## Variáveis de Ambiente (Fase 3)

```env
SEARCH_ENABLED=false          # Ligar apenas quando pronto
SEARCH_ENGINE=opensearch       # opensearch | elasticsearch
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_INDEX_PREFIX=avalia_solar_development
```

Em produção:
```env
SEARCH_ENABLED=true
OPENSEARCH_URL=https://seu-cluster.opensearch.amazonaws.com
OPENSEARCH_INDEX_PREFIX=avalia_solar_production
```
