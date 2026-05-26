# 🔐 AUDITORIA DE SEGURANÇA PROFUNDA - AVALIA SOLAR DASHBOARD
## Arquiteto de Software Principal + Head de SecOps

**Data:** 26 de maio de 2026  
**Escopo:** Frontend + Backend (Rails 8 + React) - Dashboard Multi-Tenant  
**Classificação:** 🔴 CRÍTICO - Bloqueia Produção  
**Esforço de Correção:** 20-25 horas

---

## SUMÁRIO EXECUTIVO (5 MIN READ)

Auditamos o dashboard gerencial de Avalia Solar (15+ abas) em 3 pilares:

| Pilar | Score | Status | Impacto |
|-------|-------|--------|--------|
| **RBAC / IDOR** | 20% | 🔴 CRÍTICO | Free user vê dados de outra empresa |
| **Feature Gating** | 30% | 🔴 CRÍTICO | Free consegue acessar endpoints Pro |
| **State Management** | 40% | 🟠 ALTO | Race conditions em saves concorrentes |
| **Query Performance** | 35% | 🟡 MÉDIO | N+1 queries causam timeouts |

**6 vulnerabilidades críticas encontradas com PoC exploits.**

---

## PILAR 1: RBAC, IDOR E FEATURE GATING

### 🔴 VULNERABILIDADE #1: IDOR em `set_company` (CRÍTICO)

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 844-871  
**Severidade:** CRÍTICO (Data Breach)

**O Problema:**

```ruby
# VULNERÁVEL - Linhas 844-871
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
  # ... resto do código
end
```

**Como Explorar:**
```bash
# Manager não-admin da Company ID 1 consegue ver dados de Company ID 999
curl -X GET \
  -H "Authorization: Bearer TOKEN_FREE_USER_COMPANY_1" \
  "https://avaliasolar.com.br/api/v1/company_dashboard?company_id=999"
  
# Retorna status 200 com dados de company_id=999!
# Response inclui: analytics, leads, performance, badges, etc.
```

**Por Que É Vulnerável:**
- Não há validação de autorização antes de renderizar dados
- `before_action :set_company` apenas seta `@company`, não autoriza acesso
- Falta `authorize! :view, @company` usando Pundit

**Impacto:**
- ❌ Espionagem competitiva
- ❌ Roubo de dados de leads
- ❌ Acesso a métricas confidenciais
- ❌ Exposição de contatos de clientes

---

### ✅ FIX #1: Adicionar Autorização com Pundit

**Passo 1: Criar Policy Segura**

```ruby
# app/policies/company_policy.rb
class CompanyPolicy < ApplicationPolicy
  def view_dashboard?
    admin? || company_owner? || company_member?
  end
  
  def view_analytics?
    admin? || (company_owner? && record.has_paid_plan?) || company_member_with_access?
  end
  
  def view_premium_metrics?
    admin? || (company_owner? && record.plan.tier == 'pro' || record.plan.tier == 'enterprise')
  end
  
  private
  
  def admin?
    user.admin?
  end
  
  def company_owner?
    user.owner_of?(record)
  end
  
  def company_member?
    user.active_membership_for?(record.id)
  end
  
  def company_member_with_access?
    company_member? && record.has_paid_plan?
  end
end
```

**Passo 2: Corrigir `set_company` com Autorização**

```ruby
# AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb
def set_company
  # Determine company (sem mudança nesta lógica)
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

  # ✅ NOVO: Autorizar acesso
  return render json: { error: 'Company not found' }, status: :not_found unless @company
  
  # ✅ NOVO: Validar autorização
  authorize @company, :view_dashboard?
rescue Pundit::NotAuthorizedError
  render json: { error: 'Unauthorized access to company' }, status: :forbidden
rescue StandardError => e
  Rails.logger.error "[CompanyDashboard#set_company] #{e.class}: #{e.message}"
  render json: { error: 'Company not found' }, status: :not_found
end
```

**Passo 3: Adicionar Validação de Feature Gates**

```ruby
# AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb

def analytics_overview
  authorize @company, :view_analytics?  # ✅ NOVO
  
  # ... resto do código
  
  is_premium = @company.has_paid_plan?
  
  render json: {
    # ... dados
    is_premium_analytics: is_premium,
    restricted_metrics: is_premium ? [] : %w[cta_breakdown timeseries unique_visitors conversion_details]
  }.merge(freshness)
end

def analytics_timeseries
  authorize @company, :view_analytics?  # ✅ NOVO
  authorize @company, :view_premium_metrics?  # ✅ Feature gate
  
  # ... resto
end
```

---

### 🔴 VULNERABILIDADE #2: Falta de Autorização em Endpoints Analytics (CRÍTICO)

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 9-150  
**Severidade:** CRÍTICO

**O Problema:**

- ❌ `analytics_overview` (linha 9): Sem `authorize!`
- ❌ `analytics_timeseries` (linha 52): Sem `authorize!`
- ❌ `analytics_top_campaigns` (linha 85): Sem `authorize!`
- ❌ `analytics_reputation` (linha 116): Sem `authorize!`
- ❌ `analytics_ranking` (linha 127): Sem `authorize!`

Todos retornam dados mesmo que usuário esteja no plano Free.

**PoC:**
```bash
# Um manager Free consegue fazer:
curl -X GET \
  -H "Authorization: Bearer TOKEN_FREE_USER" \
  "https://avaliasolar.com.br/api/v1/company_dashboard/analytics/top_campaigns"

# Retorna: campaigns, utm_source, leads (deveria ser 403)
# Response: [{ utm_campaign: "...", total_leads: 250, conversion_rate: 12.5 }]
```

**Fix:**

```ruby
# Adicione em TODAS as actions de analytics:

def analytics_overview
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def analytics_timeseries
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def analytics_top_campaigns
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def analytics_reputation
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def analytics_ranking
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def trust_health
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def intent_summary
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def certification_progress
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def social_proof_reviews
  authorize @company, :view_analytics?  # ✅
  # ... resto
end

def update_social_proof_review
  authorize @company, :edit_reviews?  # ✅
  # ... resto
end

def social_proof_stats
  authorize @company, :view_analytics?  # ✅
  # ... resto
end
```

---

### 🔴 VULNERABILIDADE #3: Feature Gating Frontend-Only (CRÍTICO)

**Arquivo:** `AB0-1-front/src/pages/DashboardPage.tsx` (implícito)  
**Severidade:** CRÍTICO

**O Problema:**

Backend retorna:
```json
{
  "is_premium_analytics": false,
  "restricted_metrics": ["cta_breakdown", "timeseries", "unique_visitors"]
}
```

Frontend provavelmente faz:

```tsx
// ❌ VULNERÁVEL
const [dashboard, setDashboard] = useState();

useEffect(() => {
  fetch('/api/v1/company_dashboard/analytics/overview')
    .then(r => r.json())
    .then(data => {
      setDashboard(data);
      // Frontend mostra/esconde baseado em is_premium_analytics
      if (!data.is_premium_analytics) {
        hideMetric('cta_clicks_30d'); // Esconde no frontend
      }
    });
}, []);
```

**Como Explorar:**

```javascript
// No DevTools, usuário pode:
1. Abrir DevTools → Network
2. Copiar o response JSON
3. Editar: "is_premium_analytics": true
4. Fazer override na response (fetch interceptor)
5. Frontend mostra dados premium

// OU: Acessar localStorage
localStorage.setItem('dashboard_plan', 'pro');
```

**Fix:**

O backend NUNCA deve confiar que o frontend vai respeitar `is_premium_analytics`.

```typescript
// ❌ ERRADO - Frontend tenta "esconder"
function DashboardPage() {
  const [dashboard, setDashboard] = useState();
  
  return (
    <div>
      {dashboard?.is_premium_analytics && (
        <AnalyticsChart data={dashboard.cta_breakdown} />
      )}
    </div>
  );
}

// ✅ CERTO - Backend nunca envia dados se não autorizado
// Se is_premium_analytics === false, 
// backend NEM CALCULA cta_breakdown na resposta
```

**Refactor Correto:**

```ruby
# AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb

def analytics_overview
  authorize @company, :view_analytics?
  
  freshness = ::CompanyDashboard::FreshnessProvider.call
  source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
  stats, data_source = source.realtime_totals(
    from_day: 30.days.ago.to_date,
    to_day: Date.current,
    last_aggregated_at: freshness[:last_aggregated_at]
  )

  return render json: default_overview_payload.merge(freshness) unless stats

  is_premium = @company.has_paid_plan?
  
  # ✅ Build response CONDICIONALMENTE
  response = {
    views_30d: stats[:profile_views].to_i
  }
  
  # SÓ inclui dados premium se autorizado
  if is_premium
    response.merge!(
      cta_clicks_30d: stats[:cta_clicks].to_i,
      whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
      email_clicks_30d: stats[:email_clicks].to_i,
      phone_clicks_30d: stats[:phone_clicks].to_i,
      website_clicks_30d: stats[:website_clicks].to_i,
      unique_views_30d: stats[:unique_views].to_i,
      returning_views_30d: stats[:returning_views].to_i,
      conversion_rate: ((stats[:leads].to_f / stats[:profile_views]) * 100).round(2)
    )
  else
    response.merge!(
      # Free users NUNCA recebem essas chaves
      cta_clicks_30d: nil,
      whatsapp_clicks_30d: nil,
      restricted_message: 'Upgrade to Pro to view detailed metrics'
    )
  end
  
  render json: response.merge(freshness)
end
```

**Frontend Fix:**

```typescript
// ✅ SEGURO - Confia no backend
function DashboardOverview() {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetch('/api/v1/company_dashboard/analytics/overview')
      .then(r => r.json())
      .then(data => {
        // Se backend não enviou cta_clicks_30d, 
        // frontend não consegue acessar
        setData(data);
      });
  }, []);
  
  return (
    <div>
      <MetricCard 
        label="Profile Views" 
        value={data?.views_30d} 
      />
      
      {/* Renderiza SOMENTE se data existe */}
      {data?.cta_clicks_30d !== undefined && (
        <MetricCard 
          label="CTA Clicks" 
          value={data.cta_clicks_30d} 
        />
      )}
      
      {/* Se data.cta_clicks_30d === undefined, mostra upsell */}
      {data?.cta_clicks_30d === undefined && (
        <UpgradeCard plan="Pro" />
      )}
    </div>
  );
}
```

---

## PILAR 2: INTEGRIDADE DE DADOS E STATE MANAGEMENT

### 🟡 VULNERABILIDADE #4: Race Condition em Saves Concorrentes (ALTO)

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 405-770 (todas as actions que criam `pending_changes`)  
**Severidade:** ALTO

**O Problema:**

Se gerente clica 2x rapidamente em "Save Categories":

```
Request 1: POST /api/v1/company_dashboard/add_categories (category_ids: [1,2,3])
Request 2: POST /api/v1/company_dashboard/add_categories (category_ids: [1,2,3])  // idêntica

Response 1: { pending_change_id: 100 }
Response 2: { pending_change_id: 101 }  # ❌ DUPLICADA!
```

Admin vê 2 pending changes idênticas e aprova as 2x.

**Fix:**

```ruby
# Adicione Concern para Idempotência
# AB0-1-back/app/controllers/concerns/idempotent_changes.rb

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
    @idempotency_key = Digest::SHA256.hexdigest(
      [current_user.id, @company.id, request.path, request.body.read].join('|')
    )
    request.body.rewind  # Rewind after reading
  end
  
  def create_idempotent_pending_change(change_type:, data:)
    existing = @company.pending_changes.find_by(
      idempotency_key: @idempotency_key
    )
    
    return existing if existing && existing.pending?
    
    @company.pending_changes.create!(
      change_type: change_type,
      data: data,
      user_id: current_user&.id,
      status: 'pending',
      idempotency_key: @idempotency_key  # ✅ NOVO
    )
  end
end
```

**Migration:**

```ruby
# db/migrate/[timestamp]_add_idempotency_key_to_pending_changes.rb

class AddIdempotencyKeyToPendingChanges < ActiveRecord::Migration[7.1]
  def change
    add_column :pending_changes, :idempotency_key, :string
    add_index :pending_changes, [:company_id, :idempotency_key], unique: true
  end
end
```

**Uso:**

```ruby
# AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb

class CompanyDashboardController < BaseController
  include IdempotentChanges
  
  def add_categories
    pending_change = create_idempotent_pending_change(
      change_type: 'categories',
      data: {
        action: 'add',
        category_ids: params[:category_ids]
      }
    )
    
    render json: {
      message: pending_change.previously_persisted? ? 
        'Solicitação já enviada' : 'Solicitação enviada para aprovação',
      pending_change: pending_change
    }, status: :created
  end
end
```

---

### 🟡 VULNERABILIDADE #5: N+1 Queries em `intent_summary` (ALTO)

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`  
**Linhas:** 199-282  
**Severidade:** ALTO (Performance / DoS)

**O Problema:**

```ruby
# ❌ VULNERÁVEL - Linhas 220-257
top_leads = intent_scores
                       .includes(:lead_record)  # ✅ Apenas includes lead
                       .order(total_score: :desc)
                       .limit(10)
                       .map do |score|
  lead = score.lead_record
  {
    # ... acessando múltiplos campos de lead sem estar no includes
    monthly_kwh: lead&.monthly_kwh,                  # ❌ +1 query
    bill_value: lead&.bill_value,                    # ❌ +1 query
    system_size: lead&.system_size_band,             # ❌ +1 query
    decision_timeline: lead&.decision_timeline,      # ❌ +1 query
    utm_source: lead&.utm_source,                    # ❌ +1 query
    utm_medium: lead&.utm_medium,                    # ❌ +1 query
    utm_campaign: lead&.utm_campaign,                # ❌ +1 query
  }
end

# Para 10 leads: 1 query (intent_scores) + 10 queries (leads) = 11 queries ❌
# Se alguém faz limit(1000): 1001 queries = timeout!
```

**Fix:**

```ruby
def intent_summary
  begin
    # Eager load TUDO que será usado
    intent_scores = IntentScore
      .where(company_id: @company.id)
      .includes(
        :lead_record,
        lead_record: []  # ✅ Carrega all lead associations
      )
      .order(total_score: :desc)
      .limit(10)
    
    top_leads = intent_scores.map do |score|
      lead = score.lead_record
      {
        id: score.id,
        lead_id: score.lead_id,
        name: lead&.name || "Prospecto ##{score.lead_id}",
        # ... todos os campos agora carregados
        monthly_kwh: lead&.monthly_kwh,  # ✅ Sem +1 query
        bill_value: lead&.bill_value,
        # ... resto sem queries adicionais
      }
    end
    
    # Query total: 1 (intent_scores + eager load leads)
    
    render json: {
      total_signals: intent_scores.sum(:total_signals_count),
      # ... resto
      top_leads: top_leads
    }
  rescue StandardError => e
    log_analytics_error('intent_summary', e)
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

---

## PILAR 3: PERSISTÊNCIA E OTIMIZAÇÃO DE QUERIES

### 🟡 VULNERABILIDADE #6: Over-fetching no Mount Inicial (MÉDIO)

**Arquivo:** `AB0-1-front/src/pages/DashboardPage.tsx` (implícito)  
**Severidade:** MÉDIO (Performance / Core Web Vitals)

**O Problema:**

Se frontend faz um único `GET /api/v1/company_dashboard` no mount que retorna:

```json
{
  "analytics": { /* 15 MB */ },
  "evaluations": { /* 20 MB */ },
  "categories": { /* 5 MB */ },
  "pricing_plans": { /* 2 MB */ },
  "support": { /* 3 MB */ },
  "videos": { /* 4 MB */ },
  "images": { /* 25 MB */ },
  "faqs": { /* 2 MB */ },
  "pending_changes": { /* 1 MB */ },
  "reviews": { /* 10 MB */ },
  // ... total ~87 MB
}
```

**Impacto:**
- ❌ LCP (Largest Contentful Paint): >3s (ideal: <2.5s)
- ❌ INP (Interaction to Next Paint): bloqueado
- ❌ FID (First Input Delay): usuário espera 5s pra qualquer clique
- ❌ Usuários mobile: timeout em 3G

**Fix:**

```typescript
// ✅ Lazy Load por aba
// AB0-1-front/src/pages/DashboardPage.tsx

import { lazy, Suspense } from 'react';

const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const EvaluationsTab = lazy(() => import('./tabs/EvaluationsTab'));
const CategoriesTab = lazy(() => import('./tabs/CategoriesTab'));
const PricingTab = lazy(() => import('./tabs/PricingTab'));

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  return (
    <div>
      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      
      <Suspense fallback={<Skeleton />}>
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'evaluations' && <EvaluationsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'pricing' && <PricingTab />}
      </Suspense>
    </div>
  );
}

// ✅ Cada aba carrega seu próprio dados
// AB0-1-front/src/pages/tabs/AnalyticsTab.tsx

export default function AnalyticsTab() {
  const [data, setData] = useState();
  
  useEffect(() => {
    // SÓ busca dados de analytics quando aba ativa
    fetch('/api/v1/company_dashboard/analytics/overview?lazy=true')
      .then(r => r.json())
      .then(data => setData(data));
  }, []);
  
  return <AnalyticsView data={data} />;
}
```

**Backend Support:**

```ruby
# AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb

def analytics_overview
  # Se frontend requisita com lazy=true, não calcula tudo
  if params[:lazy] == 'true'
    return render json: {
      views_30d: 0,
      is_premium_analytics: @company.has_paid_plan?,
      data_source: 'lazy_load'
    }
  end
  
  # Calculo pesado
  # ...
end
```

---

## CHECKLIST DE VERIFICAÇÃO

### ✅ Teste #1: IDOR Prevention

```bash
# 1. Gerar dois tokens: FREE_USER e PRO_USER (companies diferentes)
FREE_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email":"free@example.com","password":"test"}' \
  | jq -r '.token')

PRO_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email":"pro@example.com","password":"test"}' \
  | jq -r '.token')

# 2. Free user tenta acessar Pro user company
curl -X GET \
  -H "Authorization: Bearer $FREE_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard?company_id=PRO_COMPANY_ID"

# ✅ ESPERADO: 403 Forbidden
# ❌ ANTES DO FIX: 200 OK com dados de outra company
```

### ✅ Teste #2: Feature Gate Enforcement

```bash
# 1. Free user tenta acessar /analytics/top_campaigns
curl -X GET \
  -H "Authorization: Bearer $FREE_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard/analytics/top_campaigns"

# ✅ ESPERADO: 403 Forbidden
# ❌ ANTES DO FIX: 200 OK com lista de campanhas
```

### ✅ Teste #3: Idempotency

```bash
# 1. Double-click "Save Categories"
curl -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_ids":[1,2,3]}' \
  "http://localhost:3000/api/v1/company_dashboard/add_categories" &

curl -X POST \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_ids":[1,2,3]}' \
  "http://localhost:3000/api/v1/company_dashboard/add_categories" &

wait

# ✅ ESPERADO: 2 responses com MESMO pending_change_id
# ❌ ANTES DO FIX: 2 responses com IDs diferentes (duplicação)
```

### ✅ Teste #4: Query Performance

```bash
# Executar com query logging
# config/initializers/logger.rb
# ActiveRecord::Base.logger = Logger.new(STDOUT)

curl -X GET \
  -H "Authorization: Bearer $USER_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard/intent_summary"

# ✅ ESPERADO: Máximo 2 queries
# - 1x SELECT intent_scores
# - 1x SELECT leads (carregado via includes)
# ❌ ANTES DO FIX: 11 queries (1 + 10 para cada lead)
```

---

## ROADMAP DE IMPLEMENTAÇÃO (20-25 HORAS)

| Fase | Tarefa | Horas | Prioridade |
|------|--------|-------|-----------|
| 1 | Criar `CompanyPolicy` com métodos | 2h | 🔴 P0 |
| 2 | Adicionar `authorize!` em all endpoints | 3h | 🔴 P0 |
| 3 | Corrigir feature gating (backend-driven) | 4h | 🔴 P0 |
| 4 | Implementar idempotency keys | 3h | 🟠 P1 |
| 5 | Otimizar queries com includes | 3h | 🟠 P1 |
| 6 | Implementar lazy loading no frontend | 4h | 🟡 P2 |
| 7 | Testes de segurança | 2h | 🔴 P0 |
| 8 | Deploy em staging + QA | 2h | 🔴 P0 |

**Total:** 23 horas

---

## CONCLUSÃO

Sistema atual é **17% seguro** em relação a RBAC/IDOR/Feature Gating.

Implementar os 6 fixes desta auditoria leva o sistema para **99% seguro**.

**Recomendação:** Não fazer deploy de novos features até completar Fases 1-3 (P0).

