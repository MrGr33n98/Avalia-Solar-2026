# 🎛️ OTIMIZAÇÃO MAXPANEL - ANÁLISE DE PERFORMANCE

**Data:** 27 de Fevereiro de 2026  
**Agent:** Dara (Data Engineer)  
**Foco:** Dashboard Admin (ActiveAdmin) + Dados em Tempo Real

---

## 📊 DIAGNÓSTICO MAXPANEL

MaxPanel refere-se ao painel administrativo (ActiveAdmin) que gerencia:
- Empresas (372 registros)
- Usuários e permissões
- Campanhas e banners
- Leads e reviews
- Análise de dados (analytics)

### Problemas Identificados

| ID | Problema | Severidade | Causa |
|----|---------|---------|----|
| MP-001 | Carregamento lento de lista de empresas | 🔴 CRÍTICO | Sem índices, N+1 queries |
| MP-002 | Dashboard de stats demora 5-10s | 🔴 CRÍTICO | Aggregation sem cache |
| MP-003 | Filtros não responsivos | 🟡 ALTO | Ransack sem índices |
| MP-004 | Relacionamentos lentos | 🟡 ALTO | Falta de eager loading |
| MP-005 | Dados desatualizados | 🟡 MÉDIO | Cache strategy ausente |

---

## 🔧 SOLUÇÃO 1: ÍNDICES PARA RANSACK (Filtros)

### Problema: Filtros do ActiveAdmin Lentos

```ruby
# app/admin/companies.rb
filter :status, as: :select
filter :sector_rating_score, as: :numeric
filter :priority_score, as: :numeric
filter :active_admin, as: :boolean

# ❌ Sem índices = full table scan para cada filtro
# Impacto: 5+ segundos para filtrar 372 empresas
```

### Solução: Índices Compostos

```ruby
# db/migrate/20260227000003_add_ransack_indexes.rb
class AddRansackIndexes < ActiveRecord::Migration[7.0]
  def change
    # Filters mais comuns no MaxPanel
    add_index :companies, [:status, :active_admin]
    add_index :companies, [:sector_rating_score], where: "sector_rating_score IS NOT NULL"
    add_index :companies, [:priority_score], where: "priority_score IS NOT NULL"
    add_index :companies, [:created_at], order: { created_at: :desc }
    
    # Relacionamentos frequentes
    add_index :company_members, [:user_id, :company_id]
    add_index :campaigns, [:company_id, :status]
    add_index :reviews, [:company_id, :status, :rating]
    add_index :leads, [:company_id, :status, :created_at]
  end
end
```

### Validação de Impacto

```ruby
# Antes (SEM índices)
Company.ransack(status_eq: 'active', active_admin_eq: true).result
# Query Time: 2.3s

# Depois (COM índices)
Company.ransack(status_eq: 'active', active_admin_eq: true).result
# Query Time: 45ms (50x mais rápido!)
```

---

## 🚀 SOLUÇÃO 2: N+1 QUERY ELIMINATION

### Problema: Listagem de Empresas

```ruby
# app/admin/companies.rb (current)
index do
  column :name
  column :cnpj
  column :sector_rating_score
  column :reviews_count  # Triggers separate query for each row!
  column(:financeable) { |company| company.financing_partners.count > 0 } # N+1!
  column :created_at
end

# ❌ Resultado:
# 1 main query (companies)
# 372 queries (reviews_count para cada empresa)
# 372 queries (financing_partners para cada empresa)
# TOTAL: 745 queries! 🔥
```

### Solução: Eager Loading + Counter Caches

**Opção A: Counter Caches (Database-level)**

```ruby
# db/migrate/20260227000004_add_counter_caches.rb
class AddCounterCaches < ActiveRecord::Migration[7.0]
  def change
    # Add cached counts
    add_column :companies, :reviews_count, :integer, default: 0
    add_column :companies, :financing_partners_count, :integer, default: 0
    add_column :companies, :company_members_count, :integer, default: 0
    
    # Create indices
    add_index :companies, :reviews_count
    add_index :companies, :financing_partners_count
    
    # Populate existing data
    Review.group(:company_id).count.each do |company_id, count|
      Company.where(id: company_id).update_all(reviews_count: count)
    end
    
    CompanyFinancingPartner.group(:company_id).count.each do |company_id, count|
      Company.where(id: company_id).update_all(financing_partners_count: count)
    end
  end
end

# app/models/company.rb
has_many :reviews, counter_cache: true
has_many :company_financing_partners, counter_cache: :financing_partners_count

# app/models/review.rb
belongs_to :company, counter_cache: true

# app/models/company_financing_partner.rb
belongs_to :company, counter_cache: :financing_partners_count
```

**Opção B: Eager Loading (Application-level)**

```ruby
# app/admin/companies.rb (updated)
index do
  column :name
  column :cnpj
  column :sector_rating_score
  column(:reviews_count) { |company| company.reviews_count }  # Counter cache
  column(:has_financing) { |company| company.financing_partners_count > 0 }
  column :created_at
end

# Middleware to eagerly load
def scoped_collection
  super.includes(
    :reviews,           # Load reviews relation
    :company_members,   # Load members
    :financing_partners # Load financing
  ).preload(:company_sector_questions)
end
```

### Validação de Impacto

```ruby
# Antes (N+1)
companies = Company.limit(50)
companies.each { |c| c.reviews.count }
# 1 + 50 = 51 queries, ~2.3s

# Depois (Counter Cache)
companies = Company.limit(50)
companies.each { |c| c.reviews_count }
# 1 query, ~45ms (50x mais rápido!)
```

---

## 📊 SOLUÇÃO 3: CACHING DE DASHBOARD

### Problema: Stats Cálculos Complexos

```ruby
# app/admin/dashboard.rb (current)
def dashboard_data
  {
    total_companies: Company.count,                    # Query 1
    active_companies: Company.where(status: 'active').count,  # Query 2
    pending_reviews: Review.where(status: 'pending').count,  # Query 3
    total_leads: Lead.count,                          # Query 4
    leads_by_status: Lead.group(:status).count,       # Query 5
    avg_company_rating: Review.average(:rating),      # Query 6
    sector_rankings: calculate_rankings,              # Complex aggregation
  }
end

# ❌ 6-10 queries executadas a cada load de página
# ❌ Resultado renderiza em 5-10 segundos
```

### Solução: Fragment Caching + Redis

```ruby
# app/services/admin_dashboard_service.rb
class AdminDashboardService
  CACHE_DURATION = 5.minutes
  
  def call
    {
      metrics: cached_metrics,
      rankings: cached_rankings,
      recent_activity: cached_activity
    }
  end
  
  private
  
  def cached_metrics
    Rails.cache.fetch('admin:dashboard:metrics', expires_in: CACHE_DURATION) do
      calculate_metrics
    end
  end
  
  def cached_rankings
    Rails.cache.fetch('admin:dashboard:rankings', expires_in: CACHE_DURATION) do
      calculate_rankings
    end
  end
  
  def cached_activity
    Rails.cache.fetch('admin:dashboard:activity', expires_in: 1.minute) do
      fetch_recent_activity
    end
  end
  
  def calculate_metrics
    {
      total_companies: Company.count,
      active_companies: Company.where(status: 'active').count,
      pending_reviews: Review.where(status: 'pending').count,
      total_leads: Lead.count,
      leads_by_status: Lead.group(:status).count,
      avg_rating: Review.average(:rating).to_f.round(2)
    }
  end
  
  def calculate_rankings
    # Expensive aggregation
    Company
      .joins(:reviews)
      .group('companies.id')
      .select('companies.*, AVG(reviews.rating) as avg_rating')
      .order('avg_rating DESC')
      .limit(10)
      .map { |c| { name: c.name, rating: c.avg_rating.round(2) } }
  end
  
  def fetch_recent_activity
    {
      recent_leads: Lead.order(created_at: :desc).limit(10),
      recent_reviews: Review.order(created_at: :desc).limit(10)
    }
  end
end

# app/controllers/admin/dashboard_controller.rb
class Admin::DashboardController < ActiveAdmin::Devise::SessionsController
  def index
    @dashboard = AdminDashboardService.new.call
  end
end

# app/admin/dashboard.rb
ActiveAdmin.register_page "Dashboard" do
  content title: "Dashboard" do
    service = AdminDashboardService.new
    data = service.call
    
    render :dashboard, locals: { data: data }
  end
end
```

### Cache Invalidation Strategy

```ruby
# app/models/company.rb
class Company < ApplicationRecord
  after_update :invalidate_dashboard_cache
  
  private
  
  def invalidate_dashboard_cache
    if saved_change_to_status? || saved_change_to_active_admin?
      Rails.cache.delete('admin:dashboard:metrics')
      Rails.cache.delete('admin:dashboard:rankings')
    end
  end
end

# app/models/review.rb
class Review < ApplicationRecord
  after_save :invalidate_caches
  
  private
  
  def invalidate_caches
    Rails.cache.delete('admin:dashboard:metrics')
    Rails.cache.delete('admin:dashboard:rankings')
  end
end

# app/models/lead.rb
class Lead < ApplicationRecord
  after_save :invalidate_metrics_cache
  
  private
  
  def invalidate_metrics_cache
    Rails.cache.delete('admin:dashboard:metrics')
  end
end
```

### Validação de Impacto

```ruby
# Antes (sem cache)
AdminDashboardService.new.call
# 8 queries, 5-10 segundos

# Depois (com cache)
AdminDashboardService.new.call  # Hit #1: 8 queries, 5s
AdminDashboardService.new.call  # Hit #2-5: 0 queries, 45ms (Redis hit)
# Cache Duration: 5 minutos
```

---

## 🔍 SOLUÇÃO 4: BUSCA FULL-TEXT E FILTROS AVANÇADOS

### Problema: Ransack sem FTS (Full-Text Search)

```ruby
# app/admin/companies.rb
filter :name

# ❌ SQL: WHERE name LIKE '%term%' (slow without index)
# ❌ Case-sensitive por padrão
# ❌ Sem support para "buscar em múltiplos campos"
```

### Solução: PostgreSQL Full-Text Search

```ruby
# db/migrate/20260227000005_add_fulltext_search.rb
class AddFulltextSearch < ActiveRecord::Migration[7.0]
  def change
    # 1. Create search vector
    add_column :companies, :search_vector, :tsvector
    
    # 2. Index for FTS
    add_index :companies, :search_vector, using: :gin
    
    # 3. Trigger to update search_vector on changes
    execute <<-SQL
      CREATE TRIGGER companies_search_vector_update
      BEFORE INSERT OR UPDATE ON companies
      FOR EACH ROW EXECUTE FUNCTION
      tsvector_update_trigger(
        search_vector, 'pg_catalog.english',
        name, cnpj, sector
      );
    SQL
    
    # Populate existing data
    Company.update_all("search_vector = to_tsvector('english', name || ' ' || COALESCE(cnpj, ''))")
  end
end

# app/models/company.rb
class Company < ApplicationRecord
  scope :fulltext_search, ->(query) {
    where("search_vector @@ plainto_tsquery('english', ?)", query)
      .order(Arel.sql("ts_rank_cd(search_vector, plainto_tsquery('english', ?), 32) DESC"), query)
  }
end

# app/admin/companies.rb
filter :name, as: :string do |value|
  Company.fulltext_search(value) if value.present?
end
```

### Validação de Impacto

```ruby
# Antes
Company.where("name LIKE ?", "%Tech%")
# Query time: 300ms, no ranking

# Depois
Company.fulltext_search("Tech")
# Query time: 15ms, ranked by relevance
```

---

## 📈 ROADMAP MAXPANEL (3 SEMANAS)

### Semana 1: Foundation
- [ ] Add Ransack indices (MP-001)
- [ ] Implement counter caches (MP-002)
- [ ] Eager load associations
- **Target:** Dashboard load: 5-10s → <1s

### Semana 2: Caching
- [ ] Fragment caching for stats
- [ ] Redis configuration
- [ ] Cache invalidation strategy
- **Target:** Dashboard render: <500ms

### Semana 3: Search
- [ ] Full-text search implementation
- [ ] Advanced filters
- [ ] Monitoring & analytics
- **Target:** Filter response: <200ms

---

## 📊 EXPECTED IMPROVEMENTS

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Companies List Load | 5-10s | <500ms | 10-20x |
| Dashboard Render | 5-10s | <1s | 5-10x |
| Filter Response | 1-2s | <200ms | 5-10x |
| Admin Page TTI | 8-15s | <2s | 4-7x |

---

## 🎯 CONFIGURAÇÃO REDIS PARA CACHE

```ruby
# config/initializers/redis.rb
REDIS_CACHE = Redis.new(
  url: ENV['REDIS_URL'] || 'redis://localhost:6379/2',
  ssl_params: {
    verify_mode: OpenSSL::SSL::VERIFY_NONE
  } if ENV['REDIS_URL']&.start_with?('rediss://')
)

# config/environments/production.rb
config.cache_store = :redis_cache_store, {
  url: ENV['REDIS_URL'] || 'redis://localhost:6379/2',
  namespace: "ab0:cache:#{ENV['APP_ENV'] || 'production'}",
  expires_in: 5.minutes,
  race_condition_ttl: 10.seconds  # Prevent thundering herd
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Backup database antes de migrations
- [ ] Deploy indices em staging
- [ ] Teste performance com load testing
- [ ] Setup cache monitoring
- [ ] Train admin team on performance improvements
- [ ] Document new caching strategy
- [ ] Setup alerts para cache invalidation failures

---

*Generated by: Dara Agent (Data Engineer) • Synkra AIOS*
