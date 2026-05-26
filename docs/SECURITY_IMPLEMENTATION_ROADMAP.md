# 🛠️ ROADMAP DE IMPLEMENTAÇÃO - SECURITY FIXES
## Avalia Solar Dashboard - Fase 1 a 8

**Timeline:** 20-25 horas de desenvolvimento  
**Prioridade:** 🔴 P0 até Fase 3 (bloqueia produção)

---

## FASE 1: Criar Pundit Policy (2 HORAS)

### Arquivo: `app/policies/company_policy.rb`

```ruby
# frozen_string_literal: true

class CompanyPolicy < ApplicationPolicy
  # Main authorization checks
  def view_dashboard?
    admin? || company_member?
  end

  def view_analytics?
    admin? || company_member?
  end

  def view_premium_metrics?
    admin? || (company_member? && record.has_paid_plan?)
  end

  def view_leads?
    admin? || company_member?
  end

  def edit_company?
    admin? || company_owner?
  end

  def edit_categories?
    admin? || company_owner?
  end

  def edit_reviews?
    admin? || company_owner?
  end

  def upload_media?
    admin? || (company_owner? && record.media_upload_allowed?)
  end

  def manage_pricing?
    admin? || company_owner?
  end

  private

  def admin?
    user.admin?
  end

  def company_owner?
    user.owner_of?(record)
  end

  def company_member?
    user.active_membership_for?(record.id) || company_owner?
  end
end
```

### Adicionar métodos ao User Model

```ruby
# app/models/user.rb

class User < ApplicationRecord
  # ... existing code ...
  
  def owner_of?(company)
    company.owner_id == id || company.company_members.exists?(user_id: id, role: 'owner')
  end
  
  def active_membership_for?(company_id)
    company_members.where(company_id: company_id, status: 'active').exists?
  end
  
  def admin?
    role == 'admin'
  end
end
```

---

## FASE 2: Adicionar Autorização em Controllers (3 HORAS)

### Arquivo: `app/controllers/api/v1/company_dashboard_controller.rb`

**Passo 1: Adicionar authorize! após set_company**

```ruby
class CompanyDashboardController < BaseController
  before_action :authenticate_company_user_or_admin!
  before_action :set_company
  before_action :authorize_dashboard_access! # ✅ NOVO

  # ... resto do código

  private

  def authorize_dashboard_access!
    authorize @company, :view_dashboard?
  rescue Pundit::NotAuthorizedError
    render json: { error: 'Unauthorized access to company dashboard' }, status: :forbidden
  end

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

    render json: { error: 'Company not found' }, status: :not_found unless @company
  rescue StandardError => e
    Rails.logger.error("[CompanyDashboard#set_company] #{e.class}: #{e.message}")
    render json: { error: 'Company not found' }, status: :not_found
  end
end
```

**Passo 2: Adicionar authorize! em CADA endpoint**

```ruby
# Analytics endpoints
def analytics_overview
  authorize @company, :view_analytics?
  # ... resto do código
end

def analytics_timeseries
  authorize @company, :view_analytics?
  # ... resto do código
end

def analytics_top_campaigns
  authorize @company, :view_analytics?
  # ... resto do código
end

def analytics_reputation
  authorize @company, :view_analytics?
  # ... resto do código
end

def analytics_ranking
  authorize @company, :view_analytics?
  # ... resto do código
end

def trust_health
  authorize @company, :view_analytics?
  # ... resto do código
end

def intent_summary
  authorize @company, :view_analytics?
  # ... resto do código
end

def certification_progress
  authorize @company, :view_analytics?
  # ... resto do código
end

def social_proof_reviews
  authorize @company, :view_analytics?
  # ... resto do código
end

def update_social_proof_review
  authorize @company, :edit_reviews?
  # ... resto do código
end

def social_proof_stats
  authorize @company, :view_analytics?
  # ... resto do código
end

def update_info
  authorize @company, :edit_company?
  # ... resto do código
end

def add_categories
  authorize @company, :edit_categories?
  # ... resto do código
end

def remove_category
  authorize @company, :edit_categories?
  # ... resto do código
end

def update_ctas
  authorize @company, :edit_company?
  # ... resto do código
end

def update_logo
  authorize @company, :edit_company?
  # ... resto do código
end

def update_banner
  authorize @company, :edit_company?
  # ... resto do código
end

def upload_media
  authorize @company, :upload_media?
  # ... resto do código
end

def add_video
  authorize @company, :upload_media?
  # ... resto do código
end

def remove_video
  authorize @company, :upload_media?
  # ... resto do código
end
```

---

## FASE 3: Feature Gating Backend-Driven (4 HORAS)

### Arquivo: `app/controllers/api/v1/company_dashboard_controller.rb`

**Refactor analytics_overview para enviar APENAS dados autorizado**

```ruby
def analytics_overview
  authorize @company, :view_analytics?
  
  begin
    freshness = ::CompanyDashboard::FreshnessProvider.call
    source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
    stats, data_source = source.realtime_totals(
      from_day: 30.days.ago.to_date,
      to_day: Date.current,
      last_aggregated_at: freshness[:last_aggregated_at]
    )

    return render json: default_overview_payload.merge(freshness) unless stats

    views = stats[:profile_views].to_i
    is_premium = @company.has_paid_plan?

    # ✅ Build response CONDICIONALMENTE
    response = {
      views_30d: views,
      data_source: data_source
    }

    # SÓ inclui dados premium se tem permissão
    if is_premium
      leads = stats[:leads].to_i
      conversion = views.positive? ? ((leads.to_f / views) * 100).round(2) : 0
      
      response.merge!(
        cta_clicks_30d: stats[:cta_clicks].to_i,
        whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
        email_clicks_30d: stats[:email_clicks].to_i,
        phone_clicks_30d: stats[:phone_clicks].to_i,
        website_clicks_30d: stats[:website_clicks].to_i,
        unique_views_30d: stats[:unique_views].to_i,
        returning_views_30d: stats[:returning_views].to_i,
        leads_30d: leads,
        conversion_rate: conversion,
        is_premium_analytics: true,
        restricted_metrics: []
      )
    else
      # Free users recebem baseline APENAS
      response.merge!(
        is_premium_analytics: false,
        restricted_metrics: %w[cta_breakdown timeseries unique_visitors conversion_details],
        upsell_message: 'Upgrade to Pro to unlock detailed analytics'
      )
    end

    render json: response.merge(freshness)
  rescue StandardError => e
    log_analytics_error('overview', e)
    render json: default_overview_payload.merge(::CompanyDashboard::FreshnessProvider.call)
  end
end
```

**Adicionar feature gating parametrizável**

```ruby
# app/services/feature_gate_service.rb

class FeatureGateService
  FEATURE_ACCESS = {
    free: %w[view_dashboard basic_analytics],
    pro: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking],
    enterprise: %w[view_dashboard basic_analytics advanced_analytics top_campaigns reputation_tracking 
                   api_access webhooks white_label_support]
  }.freeze

  def self.can_access?(company, feature)
    plan_tier = company.plan&.tier || 'free'
    FEATURE_ACCESS[plan_tier.to_sym]&.include?(feature) || false
  end

  def self.accessible_features(company)
    plan_tier = company.plan&.tier || 'free'
    FEATURE_ACCESS[plan_tier.to_sym] || []
  end
end
```

---

## FASE 4: Implementar Idempotency (3 HORAS)

### Arquivo: `app/controllers/concerns/idempotent_changes.rb`

```ruby
module IdempotentChanges
  extend ActiveSupport::Concern

  included do
    before_action :set_idempotency_key, only: [
      :add_categories, :remove_category, :update_info,
      :update_ctas, :update_logo, :update_banner,
      :upload_media, :add_video, :remove_video
    ]
  end

  private

  def set_idempotency_key
    # Ler body sem consumir stream
    body = request.body.read
    request.body.rewind

    @idempotency_key = Digest::SHA256.hexdigest(
      [
        current_user&.id,
        @company&.id,
        request.path,
        body
      ].join('|')
    )
  end

  def create_idempotent_pending_change(change_type:, data:)
    # Verificar se mudança idêntica já existe
    existing = @company.pending_changes.find_by(
      idempotency_key: @idempotency_key,
      user_id: current_user&.id
    )

    # Se existe e está pending, retornar a mesma
    return existing if existing&.pending?

    # Senão, criar nova
    @company.pending_changes.create!(
      change_type: change_type,
      data: data,
      user_id: current_user&.id,
      status: 'pending',
      idempotency_key: @idempotency_key
    )
  end
end
```

### Migration

```ruby
# db/migrate/[timestamp]_add_idempotency_key_to_pending_changes.rb

class AddIdempotencyKeyToPendingChanges < ActiveRecord::Migration[7.1]
  def change
    add_column :pending_changes, :idempotency_key, :string, null: true
    
    add_index :pending_changes, 
              [:company_id, :idempotency_key, :status],
              unique: true,
              where: "status = 'pending'",
              name: 'index_unique_pending_changes_by_idempotency'
  end
end
```

### Usar em Controller

```ruby
class CompanyDashboardController < BaseController
  include IdempotentChanges

  def add_categories
    authorize @company, :edit_categories?

    pending_change = create_idempotent_pending_change(
      change_type: 'categories',
      data: {
        action: 'add',
        category_ids: params[:category_ids]
      }
    )

    message = pending_change.previously_persisted? ?
      'Solicitação já enviada' :
      'Solicitação enviada para aprovação'

    render json: { message: message, pending_change: pending_change }, 
           status: pending_change.previously_persisted? ? :ok : :created
  end
end
```

---

## FASE 5: Otimizar Queries (3 HORAS)

### Intent Summary - Fix N+1

```ruby
def intent_summary
  authorize @company, :view_analytics?
  
  begin
    unless defined?(IntentScore) && IntentScore.table_exists?
      return render json: {
        total_signals: 0,
        intent_distribution: {},
        top_leads: [],
        message: 'Intent tracking not enabled'
      }
    end

    # ✅ EAGER LOAD tudo que será usado
    intent_scores = IntentScore
      .where(company_id: @company.id)
      .includes(:lead_record)  # ← Carrega todos os leads em 1 query
      .order(total_score: :desc)
      .limit(10)
      .to_a  # ← Força executar a query agora

    top_leads = intent_scores.map do |score|
      lead = score.lead_record
      {
        id: score.id,
        lead_id: score.lead_id,
        name: lead&.name || "Prospecto ##{score.lead_id}",
        email: lead&.email,
        phone: lead&.phone,
        total_score: score.total_score,
        intent_level: score.intent_level,
        technical_profile: {
          monthly_kwh: lead&.monthly_kwh,      # ← Sem +1 query
          bill_value: lead&.bill_value,        # ← Sem +1 query
          system_size: lead&.system_size_band,
          decision_timeline: lead&.decision_timeline
        },
        marketing_data: {
          utm_source: lead&.utm_source,
          utm_medium: lead&.utm_medium,
          utm_campaign: lead&.utm_campaign
        }
      }
    end

    render json: {
      total_signals: intent_scores.sum(:total_signals_count),
      intent_distribution: intent_scores.group_by(&:intent_level)
                                        .transform_values(&:count),
      top_leads: top_leads,
      last_updated: intent_scores.max_by(&:updated_at)&.updated_at&.iso8601
    }
  rescue StandardError => e
    log_analytics_error('intent_summary', e)
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

### Outras Collections - Review

```ruby
# Verificar TODOS os includes nestas actions:
# - analytics_reputation
# - certification_progress
# - social_proof_reviews
# - social_proof_stats

def social_proof_reviews
  authorize @company, :view_analytics?
  
  # ✅ Eager load user para não ter N+1 em review.user_name
  reviews = @company.reviews
    .includes(:user)  # ← Adicionar includes
    .order(created_at: :desc)

  feature_permission = current_user&.admin? || @company.can_use_social_proof?

  render json: {
    reviews: reviews.map do |review|
      {
        id: review.id,
        rating: review.rating.to_f,
        user_name: review.user&.name  # ← Agora não causa +1 query
        # ... resto
      }
    end,
    permissions: {
      can_feature_reviews: feature_permission,
      featured_limit: Review::MAX_FEATURED_PER_COMPANY
    }
  }, status: :ok
end
```

---

## FASE 6: Frontend Lazy Loading (4 HORAS)

### Arquivo: `AB0-1-front/src/pages/DashboardPage.tsx`

```typescript
import { lazy, Suspense, useState } from 'react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

// ✅ Code splitting por tab
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const EvaluationsTab = lazy(() => import('./tabs/EvaluationsTab'));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab'));
const CompanyProfileTab = lazy(() => import('./tabs/CompanyProfileTab'));
const QuestionsTab = lazy(() => import('./tabs/QuestionsTab'));
const ReviewsTab = lazy(() => import('./tabs/ReviewsTab'));
const BadgesTab = lazy(() => import('./tabs/BadgesTab'));

type TabType = 'analytics' | 'evaluations' | 'performance' | 'profile' | 'questions' | 'reviews' | 'badges';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* Tabs Navigation */}
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Content - Only render active tab */}
      <div className="tab-content">
        <Suspense fallback={<SkeletonLoader height={400} />}>
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'evaluations' && <EvaluationsTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'profile' && <CompanyProfileTab />}
          {activeTab === 'questions' && <QuestionsTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'badges' && <BadgesTab />}
        </Suspense>
      </div>
    </div>
  );
}
```

### Arquivo: `AB0-1-front/src/pages/tabs/AnalyticsTab.tsx`

```typescript
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface DashboardData {
  views_30d: number;
  is_premium_analytics: boolean;
  cta_clicks_30d?: number;
  upsell_message?: string;
  restricted_metrics: string[];
}

export default function AnalyticsTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Fetch ONLY when tab is active
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Backend nunca envia dados se não autorizado
        const response = await apiClient.get(
          '/api/v1/company_dashboard/analytics/overview',
          {
            params: { lazy: 'true' }  // Backend pode otimizar
          }
        );
        setData(response.data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []); // ✅ Executa apenas 1x quando componente monta

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div className="analytics-container">
      {/* Sempre mostra */}
      <MetricCard
        label="Profile Views (30d)"
        value={data.views_30d}
      />

      {/* Mostra SOMENTE se backend enviou */}
      {data.is_premium_analytics && data.cta_clicks_30d !== undefined ? (
        <>
          <MetricCard
            label="CTA Clicks"
            value={data.cta_clicks_30d}
          />
          {/* Mais métricas premium */}
        </>
      ) : (
        <UpgradeCard
          title="Analytics Avançado"
          message={data.upsell_message || 'Upgrade to Pro for advanced metrics'}
          planName="Pro"
          price="$199/mês"
        />
      )}
    </div>
  );
}
```

---

## FASE 7: Testes de Segurança (2 HORAS)

### Arquivo: `spec/requests/company_dashboard_security_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe 'Company Dashboard Security', type: :request do
  let(:free_user) { create(:user) }
  let(:pro_user) { create(:user) }
  let(:free_company) { create(:company, plan: create(:plan, tier: 'free')) }
  let(:pro_company) { create(:company, plan: create(:plan, tier: 'pro')) }

  before do
    create(:company_member, user: free_user, company: free_company, role: 'owner')
    create(:company_member, user: pro_user, company: pro_company, role: 'owner')
  end

  describe 'IDOR Prevention' do
    context 'when accessing another company dashboard' do
      it 'denies access to non-member user' do
        free_token = free_user.tokens.create.token
        
        get "/api/v1/company_dashboard?company_id=#{pro_company.id}",
            headers: { 'Authorization' => "Bearer #{free_token}" }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to match(/unauthorized/i)
      end

      it 'allows access to own company' do
        free_token = free_user.tokens.create.token
        
        get "/api/v1/company_dashboard?company_id=#{free_company.id}",
            headers: { 'Authorization' => "Bearer #{free_token}" }

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe 'Feature Gating' do
    context 'when accessing premium analytics' do
      it 'denies Free user access to top_campaigns' do
        free_token = free_user.tokens.create.token
        
        get "/api/v1/company_dashboard/analytics/top_campaigns",
            headers: { 'Authorization' => "Bearer #{free_token}" }

        expect(response).to have_http_status(:forbidden)
      end

      it 'allows Pro user access to top_campaigns' do
        pro_token = pro_user.tokens.create.token
        
        get "/api/v1/company_dashboard/analytics/top_campaigns",
            headers: { 'Authorization' => "Bearer #{pro_token}" }

        expect(response).to have_http_status(:ok)
      end

      it 'does not include premium fields in Free user response' do
        free_token = free_user.tokens.create.token
        
        get "/api/v1/company_dashboard/analytics/overview",
            headers: { 'Authorization' => "Bearer #{free_token}" }

        data = JSON.parse(response.body)
        expect(data['cta_clicks_30d']).to be_nil
        expect(data['is_premium_analytics']).to be false
      end

      it 'includes premium fields in Pro user response' do
        pro_token = pro_user.tokens.create.token
        
        get "/api/v1/company_dashboard/analytics/overview",
            headers: { 'Authorization' => "Bearer #{pro_token}" }

        data = JSON.parse(response.body)
        expect(data['cta_clicks_30d']).to be_present
        expect(data['is_premium_analytics']).to be true
      end
    end
  end

  describe 'Idempotency' do
    it 'prevents duplicate pending changes on double-click' do
      free_token = free_user.tokens.create.token
      params = { category_ids: [1, 2, 3] }

      # First request
      post "/api/v1/company_dashboard/add_categories",
           params: params,
           headers: { 'Authorization' => "Bearer #{free_token}" }
      first_response = JSON.parse(response.body)

      # Second identical request
      post "/api/v1/company_dashboard/add_categories",
           params: params,
           headers: { 'Authorization' => "Bearer #{free_token}" }
      second_response = JSON.parse(response.body)

      # Should return same pending_change_id
      expect(first_response['pending_change']['id'])
        .to eq(second_response['pending_change']['id'])
      
      # Should have only 1 pending change
      expect(free_company.pending_changes.pending.count).to eq(1)
    end
  end

  describe 'Query Performance' do
    it 'loads intent_summary with minimal queries' do
      pro_token = pro_user.tokens.create.token
      create_list(:intent_score, 10, company: pro_company)

      expect do
        get "/api/v1/company_dashboard/intent_summary",
            headers: { 'Authorization' => "Bearer #{pro_token}" }
      end.to make_database_queries(count: 2..3)  # Max 3 queries
    end
  end
end
```

---

## FASE 8: Deploy em Staging + QA (2 HORAS)

### Checklist de Deployment

- [ ] Executar specs de segurança localmente: `rspec spec/requests/company_dashboard_security_spec.rb`
- [ ] Rodar linter: `rubocop app/`
- [ ] Merge em develop branch
- [ ] Deploy em staging
- [ ] Teste manual IDOR: `curl -H "Authorization: Bearer FREE_TOKEN" GET /api/v1/company_dashboard?company_id=999`
- [ ] Teste manual Feature Gate: `curl -H "Authorization: Bearer FREE_TOKEN" GET /api/v1/company_dashboard/analytics/top_campaigns`
- [ ] Teste performance: `ab -n 100 -c 10 http://staging.avaliasolar.com/api/v1/company_dashboard/analytics/overview`
- [ ] QA Sign-off
- [ ] Deploy em produção com feature flag (rollback ready)

---

## RESUMO

| Fase | O Quê | Horas | Status |
|------|-------|-------|--------|
| 1 | CompanyPolicy | 2h | 🔴 TODO |
| 2 | authorize! em controllers | 3h | 🔴 TODO |
| 3 | Feature gating backend | 4h | 🔴 TODO |
| 4 | Idempotency | 3h | 🟠 TODO |
| 5 | Query optimization | 3h | 🟠 TODO |
| 6 | Frontend lazy load | 4h | 🟡 TODO |
| 7 | Testes | 2h | 🔴 TODO |
| 8 | Deploy | 2h | 🔴 TODO |

**Total: 23 horas**

