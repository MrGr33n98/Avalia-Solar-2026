# GEO Search Discovery — Avalia Solar

**Data:** 2026-06-15  
**Sprint:** GEO A — Discovery  
**Status:** Concluído

---

## 1. Campos Existentes

### `companies` (tabela PostgreSQL)

| Campo            | Tipo                     | Existe? | Observação                                  |
|------------------|--------------------------|---------|---------------------------------------------|
| `latitude`       | decimal(10,6)            | ✅ SIM  | Adicionado em migration `20231020123460`    |
| `longitude`      | decimal(10,6)            | ✅ SIM  | Adicionado em migration `20231020123460`    |
| `city`           | string                   | ✅ SIM  | Texto livre (ex: "Cuiabá")                 |
| `state`          | string                   | ✅ SIM  | Sigla UF (ex: "MT")                        |
| `coverage_cities`| text                     | ✅ SIM  | Lista separada por vírgula (texto livre)    |
| `coverage_states`| text                     | ✅ SIM  | Lista separada por vírgula (texto livre)    |
| `geocoded_at`    | datetime                 | ❌ NÃO  | Precisa adicionar via migration             |
| `geocoding_status` | string               | ❌ NÃO  | Precisa adicionar via migration             |

### `br_locations.json` (config/data)

| Campo          | Existe? | Observação                                          |
|----------------|---------|-----------------------------------------------------|
| `state.acronym`| ✅ SIM  | Sigla dos estados brasileiros (AC, AL, ..., TO)    |
| `state.name`   | ✅ SIM  | Nome completo do estado                             |
| `state.cities` | ✅ SIM  | Lista de cidades por estado (nomes em texto)        |
| `city.latitude`| ❌ NÃO  | Não existente — arquivo apenas lista nomes          |
| `city.longitude`| ❌ NÃO | Não existente — arquivo apenas lista nomes          |

> **Conclusão:** O arquivo `br_locations.json` é puramente nominal. Cidades não têm coordenadas.

### Tabelas de cidades (PostgreSQL)

Não existe tabela relacional de cidades no schema (`cities`, `states`, `municipalities`). A localização é tratada como **texto livre** em `company.city` e `company.state`, com validação via `BrLocations`.

### OpenSearch (Searchkick)

| Campo        | No `search_data`? | Tipo OpenSearch | Observação                          |
|--------------|-------------------|-----------------|-------------------------------------|
| `city`       | ✅ SIM            | keyword/text    | Indexado normalmente                |
| `state`      | ✅ SIM            | keyword/text    | Indexado normalmente                |
| `location`   | ❌ NÃO            | `geo_point`     | **Não indexado ainda**              |

> O documento `docs/search_index_mapping.md` já prevê o campo `location: { type: geo_point }` mas **não foi implementado**.

### GraphQL

| Campo          | No `CompanyType`? | Observação                        |
|----------------|-------------------|-----------------------------------|
| `city`         | ✅ SIM            | Exposto                           |
| `state`        | ✅ SIM            | Exposto                           |
| `latitude`     | ❌ NÃO            | **Não exposto** (campo existe no DB) |
| `longitude`    | ❌ NÃO            | **Não exposto** (campo existe no DB) |
| `distanceKm`   | ❌ NÃO            | **Não existe** no tipo nem no serviço |
| `radiusKm`     | ❌ NÃO            | **Não existe** nos filtros         |
| `mapBounds`    | ❌ NÃO            | **Não existe** no input            |

### Frontend Web (Next.js)

| Componente/Feature   | Existe? | Observação                                          |
|----------------------|---------|-----------------------------------------------------|
| `SearchMapPanel`     | ❌ NÃO  | Não existe nenhum componente de mapa               |
| `SearchRadiusFilter` | ❌ NÃO  | Não existe filtro de raio                          |
| `MapProvider`        | ❌ NÃO  | Nenhuma abstração de provedor de mapa              |
| `google-maps-react`  | ❌ NÃO  | Nenhuma lib de mapa instalada                      |
| `mapbox-gl`          | ❌ NÃO  | Nenhuma lib de mapa instalada                      |
| Lat/lng no card      | ❌ NÃO  | `distanceKm` não aparece nos cards de busca        |
| lat/lng em Company   | ✅ PARCIAL | `company.latitude` existe na interface de tipo, mas **não na query da search page** |

### App Mobile (React Native / Expo)

| Feature              | Existe? | Observação                            |
|----------------------|---------|---------------------------------------|
| `MobileSearchMapScreen` | ❌ NÃO | Não existe                          |
| `MobileRadiusFilter` | ❌ NÃO  | Não existe                            |
| `expo-location`      | ❌ NÃO  | Não instalado                         |
| `react-native-maps`  | ❌ NÃO  | Não instalado                         |
| Permissão de localização | ❌ NÃO | Nenhum fluxo implementado          |

---

## 2. Campos Faltantes

### Backend Rails

| Item                          | Prioridade |
|-------------------------------|------------|
| `companies.geocoded_at`       | Alta       |
| `companies.geocoding_status`  | Alta       |
| `search_data` com `location`  | Alta       |
| `Geo::GeocodeCompanyService`  | Alta       |
| `GeocodeCompanyJob`           | Alta       |
| Filtro por `radiusKm` no OpenSearch | Alta |
| Filtro por `mapBounds` no OpenSearch | Média |
| Facetas de distância          | Média      |
| `br_locations.json` com lat/lng | Média   |
| PostGIS (opcional)            | Baixa      |

### GraphQL

| Item                          | Prioridade |
|-------------------------------|------------|
| `latitude/longitude` em `CompanyType` | Alta |
| `distanceKm` em `CompanyType` | Alta       |
| `radiusKm` nos filtros de `companies` | Alta |
| `latitude/longitude` nos filtros | Alta   |
| `mapBounds` input type        | Média      |
| `map` payload no resultado de busca | Média |

### Frontend Web

| Item                          | Prioridade |
|-------------------------------|------------|
| `SearchRadiusFilter`          | Alta       |
| `SearchMapPanel`              | Alta       |
| `MapProvider` (abstração)     | Alta       |
| Google Maps ou Mapbox instalado | Alta     |
| Distância no card de empresa  | Alta       |
| Feature flags ENV             | Alta       |
| Eventos PostHog geo           | Média      |

### App Mobile

| Item                          | Prioridade |
|-------------------------------|------------|
| `expo-location`               | Alta       |
| `react-native-maps`           | Alta       |
| `MobileSearchMapScreen`       | Alta       |
| `MobileRadiusFilter`          | Alta       |
| Fluxo de permissão de localização | Alta   |

---

## 3. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Empresas sem lat/lng quebrarem busca por raio | Alta | Alto | Empresas sem coordenada excluídas apenas de busca por raio; aparecem normalmente em busca textual |
| OpenSearch não aceitar geo_point sem reindexação | Alta | Alto | Reindexar após adicionar `location` ao `search_data` |
| Geocoding com API key inválida bloquear cadastro | Alta | Alto | Geocoding 100% assíncrono via Job; nunca bloqueia fluxo síncrono |
| PostGIS não habilitado no PostgreSQL de produção | Média | Médio | Primeira versão usa fórmula Haversine em Ruby/SQL puro; PostGIS é opcional |
| `br_locations.json` sem coordenadas de cidades | Alta | Médio | Adicionar coordenadas de capitais e principais cidades num JSON separado (`city_centroids.json`) |
| Google Maps API key ser exposta no frontend | Alta | Alto | Key restrita por domínio; usar env vars; nunca commitar key |
| Custo de geocoding com muitas empresas | Média | Médio | Usar Nominatim/OSM para batch inicial; Google Maps apenas para novas empresas |
| React Native Maps quebrar build Android | Média | Alto | Testar em branch separado; feature flag `MOBILE_SEARCH_MAP_ENABLED=false` |
| Usuário com GPS preciso sendo rastreado | Baixa | Alto | Arredondar coordenadas ao km; PostHog recebe apenas cidade/estado/raio |

---

## 4. Plano de Migração

### Sprint GEO A ✅ (Este documento — Discovery)
- [x] Mapear campos existentes
- [x] Identificar lacunas
- [x] Documentar riscos
- [x] Propor migrations necessárias
- [x] Definir feature flags

### Sprint GEO B — Banco de dados e Geocoding
- [ ] Migration: adicionar `geocoded_at` e `geocoding_status` em `companies`
- [ ] Criar `city_centroids.json` com lat/lng das principais cidades brasileiras (capitais + cidades > 100k hab)
- [ ] Criar `Geo::GeocodeCompanyService` com fallback por centroide de cidade
- [ ] Criar `GeocodeCompanyJob` (Sidekiq, assíncrono)
- [ ] Atualizar Active Admin com lat/lng editável e status de geocoding
- [ ] Adicionar ações no Active Admin: "Geocodificar" e "Reprocessar"

### Sprint GEO C — OpenSearch geo e GraphQL
- [ ] Atualizar `Company#search_data` para incluir `location: { lat:, lon: }` quando disponível
- [ ] Reindexar empresas após mudança no `search_data`
- [ ] Adicionar suporte a `latitude`, `longitude`, `radius_km` no `CompanySearchService`
- [ ] Adicionar filtro `geo_distance` no OpenSearch
- [ ] Adicionar facetas de distância
- [ ] Expor `latitude`, `longitude`, `distance_km` no `CompanyType` GraphQL
- [ ] Adicionar `radius_km`, `latitude`, `longitude`, `map_bounds` nos filtros GraphQL

### Sprint GEO D — Web UI
- [ ] Criar `SearchRadiusFilter`
- [ ] Criar `SearchMapPanel` (painel lateral com mapa)
- [ ] Criar `MapProvider` (abstração Google Maps/Mapbox/Leaflet)
- [ ] Instalar lib de mapa (avaliar `@vis.gl/react-google-maps` ou `react-leaflet`)
- [ ] Adicionar distância nos cards de empresa
- [ ] Suporte a URL `/search?lat=&lng=&radius=`
- [ ] Eventos PostHog geo (web)
- [ ] Feature flags via `NEXT_PUBLIC_SEARCH_MAP_ENABLED`

### Sprint GEO E — App Mobile
- [ ] Instalar `expo-location` e `react-native-maps`
- [ ] Criar fluxo de permissão de localização
- [ ] Criar `MobileSearchMapScreen`
- [ ] Criar `MobileRadiusFilter` no FilterSheet existente
- [ ] Eventos PostHog geo (mobile)
- [ ] Feature flags via `MOBILE_SEARCH_MAP_ENABLED`

---

## 5. Fallback

```
Busca textual normal (sem raio)
  → Sempre funciona
  → Não depende de lat/lng

Busca por raio via OpenSearch
  → Requer: lat/lng da empresa, geo_point indexado, flag SEARCH_GEO_ENABLED=true
  → Fallback: se OpenSearch falhar → PostgreSQL Haversine
  → Fallback: se empresa sem lat/lng → empresa exibida SEM distância (aparece no final)

Mapa
  → Requer: SEARCH_MAP_ENABLED=true, API Key válida
  → Fallback: se flag off → mapa não renderiza, busca continua normalmente
  → Fallback: se API Key inválida → mapa não aparece, erro silencioso

Geocoding
  → Sempre assíncrono (Job Sidekiq)
  → Fallback por centroide da cidade se endereço não geocodificável
  → Empresa sem geocoding continua ativa normalmente
```

---

## 6. Feature Flags

### Backend (`.env` / `config/initializers`)

```env
SEARCH_GEO_ENABLED=false
SEARCH_RADIUS_FILTER_ENABLED=false
SEARCH_MAP_ENABLED=false
SEARCH_MAP_PROVIDER=google
SEARCH_GEO_FALLBACK_POSTGRES=true
SEARCH_GEO_DEBUG=false
GEOCODING_PROVIDER=nominatim
GOOGLE_GEOCODING_API_KEY=
```

### Frontend Web (`.env.local`)

```env
NEXT_PUBLIC_SEARCH_MAP_ENABLED=false
NEXT_PUBLIC_MAP_PROVIDER=google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

### Mobile (`.env` do Expo)

```env
MOBILE_SEARCH_MAP_ENABLED=false
MOBILE_LOCATION_PERMISSION_ENABLED=false
```

---

## 7. Migrations Necessárias

### Migration 1 — `geocoded_at` e `geocoding_status` em companies

```ruby
# db/migrate/20260615100000_add_geocoding_fields_to_companies.rb
class AddGeocodingFieldsToCompanies < ActiveRecord::Migration[7.1]
  def change
    add_column :companies, :geocoded_at, :datetime
    add_column :companies, :geocoding_status, :string, default: 'pending'
    add_index :companies, :geocoding_status
    add_index :companies, [:latitude, :longitude],
              name: 'index_companies_on_lat_lng',
              where: 'latitude IS NOT NULL AND longitude IS NOT NULL'
  end
end
```

> **Nota:** `latitude` e `longitude` já existem no schema. A migration só adiciona os campos de controle de geocoding.

### Migration 2 — Nenhuma necessária para cidades

Não existe tabela de cidades. A estratégia é:
1. Criar `config/data/city_centroids.json` com lat/lng das principais cidades
2. Usar esse JSON no `GeocodeCompanyService` como fallback

---

## 8. Arquitetura de Serviços (Proposta)

```
app/
  services/
    geo/
      geocode_company_service.rb    ← Busca lat/lng via API/fallback
      haversine_calculator.rb       ← Fórmula Haversine para fallback PG
      city_centroid_service.rb      ← Consulta city_centroids.json
  jobs/
    geocode_company_job.rb          ← Sidekiq job assíncrono
  graphql/
    types/
      map_bounds_input_type.rb      ← Input: north/south/east/west
      map_company_type.rb           ← Empresa simplificada para o mapa (id, lat, lng, score)
      map_result_type.rb            ← { companies, clusters, bounds }
      geo_distance_facet_type.rb    ← Facetas de distância (Até 10km, etc.)

config/
  data/
    city_centroids.json             ← lat/lng das ~400 principais cidades BR
```

---

## 9. Resumo Executivo

| Ponto | Status |
|-------|--------|
| `companies.latitude/longitude` existe no DB | ✅ **SIM** |
| `geocoding_status` existe | ❌ **NÃO** — precisa de migration |
| Cidades com lat/lng | ❌ **NÃO** — precisa de `city_centroids.json` |
| OpenSearch indexa `geo_point` | ❌ **NÃO** — precisa de `search_data` update + reindex |
| GraphQL expõe lat/lng/distance | ❌ **NÃO** — precisa de novos campos |
| Web tem mapa | ❌ **NÃO** — precisa de lib + componentes |
| Mobile tem mapa | ❌ **NÃO** — precisa de lib + componentes |
| Feature flags existem | ❌ **NÃO** — precisam ser criadas |
| PostGIS habilitado | ❌ **NÃO** — usar Haversine por ora |

**A base de dados já suporta lat/lng para empresas. O trabalho começa nos campos de controle (geocoding_status), no índice OpenSearch e nos componentes Web/Mobile.**
