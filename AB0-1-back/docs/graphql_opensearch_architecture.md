# Arquitetura GraphQL + OpenSearch — Avalia Solar

## Visão Geral

O Avalia Solar evolui para uma arquitetura de **camadas paralelas**, onde o REST e o GraphQL coexistem durante a transição:

```
┌────────────────────────────────────────────────────┐
│              CLIENTES                              │
│  Web Next.js         App Android Expo              │
│  (REST + GraphQL)    (REST + GraphQL)              │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│              RAILS API                             │
│  /api/v1/*     (REST — mantido)                   │
│  /graphql      (GraphQL — novo, paralelo)          │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│           FONTES DE DADOS                          │
│  PostgreSQL  ←  Fonte da Verdade                  │
│  Redis       ←  Cache (já instalado)              │
│  OpenSearch  ←  Busca/Ranking (Fase 3+)           │
└────────────────────────────────────────────────────┘
```

---

## Fases de Implementação

### Fase 0 — Diagnóstico (concluída)
- Mapear todos os endpoints REST
- Documentar models, serializers e services existentes
- Identificar campos sensíveis que NÃO devem ser expostos

### Fase 1 — GraphQL no Rails ✅
- Instalar gem `graphql`
- Criar endpoint `POST /graphql`
- Criar Types, Queries e Mutations básicos
- Tudo consultando PostgreSQL (sem OpenSearch ainda)
- REST `/api/v1` continua intacto

### Fase 2 — Apollo Client nos clientes
- Instalar `@apollo/client` no Next.js e Expo
- Configurar URI, autenticação e cache
- Migrar APENAS telas não críticas (Home do app Android)
- Feature flags para ativar/desativar por rota

### Fase 3 — OpenSearch em desenvolvimento
- Container Docker com OpenSearch
- Gem Searchkick no Rails
- Variáveis de ambiente com feature flag
- Sistema continua funcionando sem OpenSearch (`SEARCH_ENABLED=false`)

### Fase 4 — Indexação de empresas
- `Company#search_data` com campos buscáveis
- Job assíncrono via Sidekiq para reindexação
- Callbacks `after_commit` para sincronização

### Fase 5 — Search Service centralizado
- `Search::CompanySearchService` compartilhado por REST e GraphQL
- Fallback automático para PostgreSQL se OpenSearch indisponível

### Fase 6 — GraphQL + OpenSearch integrados
- Resolver `searchCompanies` usa o Search Service
- Facetas/agregações retornadas no GraphQL
- REST também usa o mesmo service com feature flag

### Fase 7 — Autocomplete e sugestões
- `GET /api/v1/search/suggestions`
- Query GraphQL `searchSuggestions`

### Fase 8 — Facetas dinâmicas
- Sidebar de filtros com contagem no Web
- Filtros dinâmicos no Android

### Fase 9 — Ranking marketplace
- Score composto: relevância + patrocínio + verificação + avaliação
- Badges transparentes para empresas impulsionadas

### Fase 10+ — Migração gradual e observabilidade

---

## Princípios de Segurança

### Dados Sensíveis — NÃO expor publicamente via GraphQL
- `email` (privado — só em contexto autenticado e autorizado)
- `phone` / `phone_alt`
- `whatsapp` / `whatsapp_url` (apenas quando `cta_whatsapp_enabled`)
- `cnpj`
- `address` completo (apenas resumido)

### Dados Públicos — podem ser expostos via GraphQL
- `id`, `name`, `slug`
- `city`, `state`
- `description`, `short_description`
- `logo_url`, `banner_url`
- `rating_avg`, `rating_count`
- `verified`, `featured`, `sponsored`
- `categories`, `services_offered`, `project_types`
- `coverage_states`, `coverage_cities`
- `website` (opcional)

---

## Stack de Decisão

| Aspecto | Decisão | Motivo |
|---|---|---|
| Motor GraphQL | `graphql-ruby ~> 2.3` | Padrão da comunidade Rails |
| DataLoader | `graphql-batch` | Evitar N+1 queries |
| Motor de busca | OpenSearch | Licença Apache 2.0, sem custo |
| Gem busca | Searchkick | Abstração simples para MVP |
| Cache | Apollo InMemoryCache + `apollo3-cache-persist` | Cache offline no mobile |
| Autenticação | JWT Bearer Token (já existente) | Reutilizar infraestrutura atual |
| Autorização | Pundit (já instalado) | Reutilizar policies existentes |
| Fila de jobs | Sidekiq (já instalado) | Reindexação assíncrona |
| Feature flags | ENV vars | Simples, reversível, sem vendor |

---

## Rollback

Para reverter completamente para o estado atual, basta:

```bash
# No .env
GRAPHQL_ENABLED=false
SEARCH_ENABLED=false
GRAPHQL_COMPANIES_ENABLED=false
```

O Rails não roteia `/graphql` se o controller não existir.
REST continua funcionando sem mudanças.
