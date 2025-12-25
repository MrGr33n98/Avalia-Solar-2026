# 🎯 Plano Estratégico: Sistema Robusto de Banners + Dashboard de Company + Planos por Features

**Para:** Avalia Solar - Product Owner  
**Data:** 2024-12-25  
**Preparado por:** Senior Solutions Architect  
**Status:** Proposta Estratégica Completa  

---

## 📊 ANÁLISE DA SITUAÇÃO ATUAL

### ✅ O Que Já Temos (Assets Valiosos)

#### 1. **Sistema de Banners Básico**
```ruby
# Tabela: banners
- title, image_url, link
- active, start_date, end_date
- sponsored, banner_type, position
- category_id (vinculado a categorias)
```

**Pontos Fortes:**
- ✅ Upload de imagens (Active Storage)
- ✅ Agendamento temporal
- ✅ Vinculação com categorias
- ✅ Admin funcional

**Gaps Críticos:**
- ❌ Não vinculado a companies
- ❌ Sem analytics
- ❌ Sem sistema de billing
- ❌ Sem dashboard para empresas

---

#### 2. **Sistema de Planos**
```ruby
# Tabela: plans
- name, description, price
- features (text)
- features_json (json) ✅ JÁ EXISTE!
```

**Pontos Fortes:**
- ✅ Já tem `features_json` (campo JSON flexível)
- ✅ Já tem relacionamento com companies
- ✅ Sistema de pricing

---

#### 3. **Company Dashboard**
```ruby
# Controller: CompanyDashboardController
- stats (estatísticas da empresa)
- pending_changes (mudanças pendentes)
- update_info, update_logo, update_banner
- plan_features (já retorna features do plano!)
```

**Pontos Fortes:**
- ✅ Sistema de aprovação de mudanças
- ✅ Já retorna `plan_features`
- ✅ Upload de logo/banner
- ✅ Notificações

---

#### 4. **Feature Group Model**
```ruby
class FeatureGroup < ApplicationRecord
  - name, description
```

**Oportunidade:**
- Pode ser usado para agrupar features por tipo

---

## 🎯 OBJETIVOS DO PROJETO

### 1. **Melhorar Sistema de Banners (Sem Quebrar)**
- Vincular banners a companies
- Analytics de impressões/cliques
- Dashboard para empresas gerenciarem
- Sistema de billing

### 2. **Dashboard de Company Completo**
- Gerenciamento de banners
- Analytics em tempo real
- Gerenciamento de conteúdo
- Controle de plano

### 3. **Super Admin: Planos por Features**
- Controle granular de features
- Planos configuráveis
- Feature flags dinâmicas

---

## 🏗️ ARQUITETURA PROPOSTA (SEM QUEBRAR)

### Fase 1: Extensão do Sistema de Banners (Backward Compatible)

#### 1.1. Nova Migration (Adicionar Campos)

```ruby
# db/migrate/YYYYMMDDHHMMSS_add_company_and_analytics_to_banners.rb
class AddCompanyAndAnalyticsToBanners < ActiveRecord::Migration[7.0]
  def change
    # Vincular a companies (opcional para não quebrar banners existentes)
    add_reference :banners, :company, foreign_key: true, null: true
    
    # Analytics
    add_column :banners, :impressions_count, :integer, default: 0
    add_column :banners, :clicks_count, :integer, default: 0
    add_column :banners, :ctr, :decimal, precision: 5, scale: 2
    
    # Billing
    add_column :banners, :cost_per_impression, :decimal, precision: 10, scale: 4, default: 0
    add_column :banners, :cost_per_click, :decimal, precision: 10, scale: 2, default: 0
    add_column :banners, :total_spent, :decimal, precision: 12, scale: 2, default: 0
    add_column :banners, :daily_budget, :decimal, precision: 10, scale: 2
    
    # Aprovação (workflow)
    add_column :banners, :status, :string, default: 'pending'
    add_column :banners, :approved_by_id, :integer
    add_column :banners, :approved_at, :datetime
    add_column :banners, :rejection_reason, :text
    
    # SEO
    add_column :banners, :alt_text, :string
    add_column :banners, :rel_attribute, :string, default: 'sponsored'
    
    # Metadata
    add_column :banners, :metadata, :json, default: {}
    
    # Indexes
    add_index :banners, :company_id
    add_index :banners, :status
    add_index :banners, [:company_id, :status]
    add_index :banners, [:active, :start_date, :end_date]
  end
end
```

**Por que isso não quebra:**
- Todos os campos são `null: true` ou tem defaults
- Banners existentes continuam funcionando
- Não afeta queries existentes

---

#### 1.2. Modelo Banner Atualizado

```ruby
# app/models/banner.rb
class Banner < ApplicationRecord
  # Relacionamentos
  belongs_to :category, optional: true
  belongs_to :company, optional: true  # ← NOVO
  belongs_to :approved_by, class_name: 'AdminUser', optional: true  # ← NOVO
  
  # Analytics
  has_many :banner_impressions, dependent: :destroy  # ← NOVO
  has_many :banner_clicks, dependent: :destroy  # ← NOVO
  
  # Attachments
  has_one_attached :image
  
  # Enums
  enum status: {
    draft: 'draft',
    pending: 'pending',
    approved: 'approved',
    active: 'active',
    paused: 'paused',
    rejected: 'rejected',
    expired: 'expired'
  }, _default: 'pending'
  
  # Validations
  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { 
    in: %w[rectangular_large rectangular_small square native_card skyscraper] 
  }
  validates :position, inclusion: { 
    in: %w[navbar sidebar categories_top category_detail homepage_hero search_results] 
  }
  validates :image, presence: true
  validates :daily_budget, numericality: { greater_than: 0, allow_nil: true }
  
  # Callbacks
  before_save :calculate_ctr
  after_update :notify_company_if_status_changed
  
  # Scopes
  scope :currently_active, -> {
    where(active: true, status: :active)
      .where('start_date IS NULL OR start_date <= ?', Time.current)
      .where('end_date IS NULL OR end_date >= ?', Time.current)
  }
  
  scope :by_company, ->(company_id) { where(company_id: company_id) }
  scope :pending_approval, -> { where(status: :pending) }
  scope :approved, -> { where(status: :approved) }
  
  scope :within_budget, -> {
    where('daily_budget IS NULL OR total_spent < daily_budget')
  }
  
  # Métodos
  def image_url
    return nil unless image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
  rescue => e
    Rails.logger.error("Error generating banner image URL: #{e.message}")
    nil
  end
  
  def calculate_ctr
    if impressions_count > 0
      self.ctr = (clicks_count.to_f / impressions_count * 100).round(2)
    else
      self.ctr = 0
    end
  end
  
  def record_impression!
    increment!(:impressions_count)
    calculate_and_save_ctr
    charge_for_impression if cost_per_impression > 0
  end
  
  def record_click!
    increment!(:clicks_count)
    calculate_and_save_ctr
    charge_for_click if cost_per_click > 0
  end
  
  def within_budget?
    return true if daily_budget.nil?
    total_spent < daily_budget
  end
  
  def approve!(admin_user)
    update!(
      status: :approved,
      approved_by: admin_user,
      approved_at: Time.current,
      active: true
    )
    BannerApprovalMailer.approved(self).deliver_later
  end
  
  def reject!(admin_user, reason)
    update!(
      status: :rejected,
      approved_by: admin_user,
      approved_at: Time.current,
      rejection_reason: reason
    )
    BannerApprovalMailer.rejected(self).deliver_later
  end
  
  def as_json(options = {})
    super(options).merge(
      image_url: image_url,
      company_name: company&.name,
      analytics: {
        impressions: impressions_count,
        clicks: clicks_count,
        ctr: ctr
      }
    )
  end
  
  private
  
  def calculate_and_save_ctr
    calculate_ctr
    save if ctr_changed?
  end
  
  def charge_for_impression
    return unless company
    amount = cost_per_impression
    increment!(:total_spent, amount)
    BannerTransaction.create!(
      banner: self,
      company: company,
      transaction_type: 'impression',
      amount: amount
    )
  end
  
  def charge_for_click
    return unless company
    amount = cost_per_click
    increment!(:total_spent, amount)
    BannerTransaction.create!(
      banner: self,
      company: company,
      transaction_type: 'click',
      amount: amount
    )
  end
  
  def notify_company_if_status_changed
    if saved_change_to_status? && company
      CompanyNotificationService.banner_status_changed(self)
    end
  end
  
  def self.ransackable_attributes(_auth_object = nil)
    %w[id title company_id category_id status active sponsored 
       banner_type position created_at updated_at]
  end
  
  def self.ransackable_associations(_auth_object = nil)
    %w[category company approved_by]
  end
end
```

---

#### 1.3. Novos Modelos (Analytics)

```ruby
# app/models/banner_impression.rb
class BannerImpression < ApplicationRecord
  belongs_to :banner
  belongs_to :company, optional: true
  
  # Tracking
  validates :session_id, presence: true
  
  # Scopes
  scope :today, -> { where('created_at >= ?', Time.current.beginning_of_day) }
  scope :this_week, -> { where('created_at >= ?', 1.week.ago) }
  scope :this_month, -> { where('created_at >= ?', 1.month.ago) }
  
  # Callbacks
  after_create :update_banner_count
  
  private
  
  def update_banner_count
    banner.record_impression!
  end
end

# Migration
class CreateBannerImpressions < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_impressions do |t|
      t.references :banner, null: false, foreign_key: true
      t.references :company, foreign_key: true
      
      # Tracking
      t.string :session_id, null: false
      t.string :user_agent
      t.string :ip_address
      t.string :device_type # mobile, desktop, tablet
      t.string :referrer
      t.json :metadata
      
      # Geo
      t.string :country
      t.string :state
      t.string :city
      
      t.timestamps
      
      # Indexes
      t.index [:banner_id, :created_at]
      t.index [:company_id, :created_at]
      t.index [:session_id, :created_at]
      t.index :created_at
    end
  end
end
```

```ruby
# app/models/banner_click.rb
class BannerClick < ApplicationRecord
  belongs_to :banner
  belongs_to :company, optional: true
  belongs_to :banner_impression, optional: true
  
  validates :session_id, presence: true
  
  after_create :update_banner_count
  
  private
  
  def update_banner_count
    banner.record_click!
  end
end

# Migration
class CreateBannerClicks < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_clicks do |t|
      t.references :banner, null: false, foreign_key: true
      t.references :company, foreign_key: true
      t.references :banner_impression, foreign_key: true
      
      # Tracking
      t.string :session_id, null: false
      t.string :user_agent
      t.string :ip_address
      t.string :referrer
      t.json :metadata
      
      t.timestamps
      
      # Indexes
      t.index [:banner_id, :created_at]
      t.index [:company_id, :created_at]
      t.index [:session_id, :created_at]
    end
  end
end
```

```ruby
# app/models/banner_transaction.rb
class BannerTransaction < ApplicationRecord
  belongs_to :banner
  belongs_to :company
  
  enum transaction_type: {
    impression: 'impression',
    click: 'click',
    deposit: 'deposit',
    refund: 'refund'
  }
  
  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  
  # Scopes
  scope :charges, -> { where(transaction_type: [:impression, :click]) }
  scope :credits, -> { where(transaction_type: [:deposit, :refund]) }
end

# Migration
class CreateBannerTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :banner_transactions do |t|
      t.references :banner, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      
      t.string :transaction_type, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.text :description
      t.json :metadata
      
      t.timestamps
      
      t.index [:company_id, :created_at]
      t.index [:banner_id, :created_at]
      t.index :transaction_type
    end
  end
end
```

---

### Fase 2: Sistema de Features e Planos

#### 2.1. Estrutura de Features (JSON)

```ruby
# Estrutura do campo features_json em plans

# Exemplo de Plan "Starter"
{
  "dashboard": {
    "enabled": true,
    "features": {
      "analytics": true,
      "basic_stats": true,
      "advanced_stats": false,
      "export_data": false
    }
  },
  "banners": {
    "enabled": true,
    "max_active_banners": 2,
    "max_impressions_per_month": 50000,
    "positions_allowed": ["sidebar", "footer"],
    "features": {
      "analytics": true,
      "ab_testing": false,
      "advanced_targeting": false,
      "priority_placement": false
    }
  },
  "content": {
    "enabled": true,
    "max_products": 10,
    "max_media_files": 20,
    "max_articles": 5,
    "features": {
      "rich_editor": true,
      "seo_tools": false,
      "scheduled_publishing": false
    }
  },
  "leads": {
    "enabled": true,
    "max_leads_per_month": 100,
    "features": {
      "lead_notifications": true,
      "lead_export": false,
      "lead_integration": false,
      "crm_sync": false
    }
  },
  "profile": {
    "enabled": true,
    "features": {
      "custom_url": false,
      "verified_badge": false,
      "featured_listing": false,
      "premium_support": false
    }
  },
  "backlinks": {
    "enabled": false,
    "max_backlinks": 0,
    "domain_authority_required": 30
  }
}

# Exemplo de Plan "Professional"
{
  "dashboard": {
    "enabled": true,
    "features": {
      "analytics": true,
      "basic_stats": true,
      "advanced_stats": true,  # ← Upgrade
      "export_data": true       # ← Upgrade
    }
  },
  "banners": {
    "enabled": true,
    "max_active_banners": 5,     # ← Upgrade
    "max_impressions_per_month": 200000,  # ← Upgrade
    "positions_allowed": ["sidebar", "footer", "categories_top", "homepage"],  # ← Upgrade
    "features": {
      "analytics": true,
      "ab_testing": true,  # ← Upgrade
      "advanced_targeting": true,  # ← Upgrade
      "priority_placement": false
    }
  },
  "content": {
    "enabled": true,
    "max_products": 50,   # ← Upgrade
    "max_media_files": 100,  # ← Upgrade
    "max_articles": 20,   # ← Upgrade
    "features": {
      "rich_editor": true,
      "seo_tools": true,  # ← Upgrade
      "scheduled_publishing": true  # ← Upgrade
    }
  },
  "leads": {
    "enabled": true,
    "max_leads_per_month": 500,  # ← Upgrade
    "features": {
      "lead_notifications": true,
      "lead_export": true,  # ← Upgrade
      "lead_integration": true,  # ← Upgrade
      "crm_sync": false
    }
  },
  "profile": {
    "enabled": true,
    "features": {
      "custom_url": true,  # ← Upgrade
      "verified_badge": true,  # ← Upgrade
      "featured_listing": false,
      "premium_support": true  # ← Upgrade
    }
  },
  "backlinks": {
    "enabled": true,  # ← Upgrade
    "max_backlinks": 3,
    "domain_authority_required": 50
  }
}

# Exemplo de Plan "Enterprise"
{
  "dashboard": {
    "enabled": true,
    "features": {
      "analytics": true,
      "basic_stats": true,
      "advanced_stats": true,
      "export_data": true,
      "custom_reports": true,  # ← Upgrade
      "api_access": true  # ← Upgrade
    }
  },
  "banners": {
    "enabled": true,
    "max_active_banners": -1,  # -1 = ilimitado
    "max_impressions_per_month": -1,  # ilimitado
    "positions_allowed": ["all"],  # todas as posições
    "features": {
      "analytics": true,
      "ab_testing": true,
      "advanced_targeting": true,
      "priority_placement": true,  # ← Upgrade
      "white_label": true  # ← Upgrade
    }
  },
  "content": {
    "enabled": true,
    "max_products": -1,  # ilimitado
    "max_media_files": -1,  # ilimitado
    "max_articles": -1,  # ilimitado
    "features": {
      "rich_editor": true,
      "seo_tools": true,
      "scheduled_publishing": true,
      "video_hosting": true,  # ← Upgrade
      "cdn_delivery": true  # ← Upgrade
    }
  },
  "leads": {
    "enabled": true,
    "max_leads_per_month": -1,  # ilimitado
    "features": {
      "lead_notifications": true,
      "lead_export": true,
      "lead_integration": true,
      "crm_sync": true,  # ← Upgrade
      "dedicated_manager": true  # ← Upgrade
    }
  },
  "profile": {
    "enabled": true,
    "features": {
      "custom_url": true,
      "verified_badge": true,
      "featured_listing": true,  # ← Upgrade
      "premium_support": true,
      "priority_placement": true  # ← Upgrade
    }
  },
  "backlinks": {
    "enabled": true,
    "max_backlinks": -1,  # ilimitado
    "domain_authority_required": 0
  }
}
```

---

#### 2.2. Service para Verificar Permissões

```ruby
# app/services/feature_access_service.rb
class FeatureAccessService
  def initialize(company)
    @company = company
    @plan = company.plan
    @features = @plan&.features_json || {}
  end
  
  # Verificar se uma feature está habilitada
  def can?(section, feature = nil)
    return false unless @features.dig(section, 'enabled')
    
    if feature
      @features.dig(section, 'features', feature) == true
    else
      true
    end
  end
  
  # Pegar limite de uma feature
  def limit(section, key)
    limit = @features.dig(section, key)
    return Float::INFINITY if limit == -1  # ilimitado
    limit || 0
  end
  
  # Verificar se atingiu o limite
  def within_limit?(section, key, current_count)
    max = limit(section, key)
    return true if max == Float::INFINITY
    current_count < max
  end
  
  # Pegar posições permitidas para banners
  def allowed_banner_positions
    positions = @features.dig('banners', 'positions_allowed') || []
    return Banner.positions.keys if positions.include?('all')
    positions
  end
  
  # Método helper para exibir no frontend
  def feature_summary
    {
      dashboard: {
        enabled: can?('dashboard'),
        analytics: can?('dashboard', 'analytics'),
        advanced_stats: can?('dashboard', 'advanced_stats'),
        export_data: can?('dashboard', 'export_data')
      },
      banners: {
        enabled: can?('banners'),
        max_active: limit('banners', 'max_active_banners'),
        max_impressions: limit('banners', 'max_impressions_per_month'),
        ab_testing: can?('banners', 'ab_testing'),
        priority: can?('banners', 'priority_placement'),
        positions: allowed_banner_positions
      },
      content: {
        enabled: can?('content'),
        max_products: limit('content', 'max_products'),
        max_media: limit('content', 'max_media_files'),
        max_articles: limit('content', 'max_articles'),
        seo_tools: can?('content', 'seo_tools')
      },
      leads: {
        enabled: can?('leads'),
        max_per_month: limit('leads', 'max_leads_per_month'),
        export: can?('leads', 'lead_export'),
        crm_sync: can?('leads', 'crm_sync')
      },
      profile: {
        enabled: can?('profile'),
        custom_url: can?('profile', 'custom_url'),
        verified_badge: can?('profile', 'verified_badge'),
        featured: can?('profile', 'featured_listing')
      },
      backlinks: {
        enabled: can?('backlinks'),
        max_backlinks: limit('backlinks', 'max_backlinks')
      }
    }
  end
end

# Uso no controller
def stats
  @access = FeatureAccessService.new(@company)
  
  render json: {
    stats: stats_data,
    plan: {
      name: @company.plan&.name,
      features: @access.feature_summary
    }
  }
end
```

---

### Fase 3: Dashboard de Company (Banners)

#### 3.1. Controller de Banners para Companies

```ruby
# app/controllers/api/v1/company_banners_controller.rb
module Api
  module V1
    class CompanyBannersController < BaseController
      before_action :authenticate_company_user!
      before_action :set_company
      before_action :check_banner_access!
      before_action :set_banner, only: [:show, :update, :destroy, :analytics, :pause, :resume]
      
      # GET /api/v1/company_banners
      def index
        @banners = @company.banners.order(created_at: :desc)
        
        render json: {
          banners: @banners.as_json(
            include: { category: { only: [:id, :name] } },
            methods: [:analytics]
          ),
          limits: banner_limits
        }
      end
      
      # GET /api/v1/company_banners/:id
      def show
        render json: {
          banner: @banner.as_json(
            include: { category: { only: [:id, :name] } },
            methods: [:analytics]
          )
        }
      end
      
      # POST /api/v1/company_banners
      def create
        # Verificar limites
        unless within_limits?
          return render json: { 
            error: 'Limite de banners atingido',
            upgrade_url: '/plans'
          }, status: :forbidden
        end
        
        @banner = @company.banners.new(banner_params)
        @banner.status = 'pending'  # Sempre pending para aprovação
        
        if @banner.save
          # Notificar admins
          AdminNotificationService.new_banner_pending(@banner)
          
          render json: {
            message: 'Banner criado e enviado para aprovação',
            banner: @banner
          }, status: :created
        else
          render json: { errors: @banner.errors }, status: :unprocessable_entity
        end
      end
      
      # PATCH /api/v1/company_banners/:id
      def update
        # Só pode editar se draft ou rejected
        unless ['draft', 'rejected'].include?(@banner.status)
          return render json: { 
            error: 'Apenas banners em rascunho ou rejeitados podem ser editados'
          }, status: :forbidden
        end
        
        if @banner.update(banner_params)
          @banner.update(status: 'pending')  # Volta para pending
          
          render json: {
            message: 'Banner atualizado e reenviado para aprovação',
            banner: @banner
          }
        else
          render json: { errors: @banner.errors }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/company_banners/:id
      def destroy
        @banner.destroy
        render json: { message: 'Banner removido' }
      end
      
      # GET /api/v1/company_banners/:id/analytics
      def analytics
        period = params[:period] || 'week'  # day, week, month, year
        
        data = BannerAnalyticsService.new(@banner).generate_report(period)
        
        render json: { analytics: data }
      end
      
      # POST /api/v1/company_banners/:id/pause
      def pause
        if @banner.update(active: false, status: 'paused')
          render json: { message: 'Banner pausado' }
        else
          render json: { errors: @banner.errors }, status: :unprocessable_entity
        end
      end
      
      # POST /api/v1/company_banners/:id/resume
      def resume
        # Verificar se ainda está dentro do budget
        unless @banner.within_budget?
          return render json: { 
            error: 'Budget diário esgotado',
            daily_budget: @banner.daily_budget,
            spent_today: @banner.total_spent
          }, status: :forbidden
        end
        
        if @banner.update(active: true, status: 'active')
          render json: { message: 'Banner reativado' }
        else
          render json: { errors: @banner.errors }, status: :unprocessable_entity
        end
      end
      
      # GET /api/v1/company_banners/stats
      def stats
        render json: {
          total_banners: @company.banners.count,
          active_banners: @company.banners.currently_active.count,
          pending_approval: @company.banners.pending_approval.count,
          total_impressions: @company.banners.sum(:impressions_count),
          total_clicks: @company.banners.sum(:clicks_count),
          avg_ctr: calculate_avg_ctr,
          total_spent_this_month: calculate_monthly_spent,
          limits: banner_limits
        }
      end
      
      private
      
      def set_company
        @company = current_user.company
        render json: { error: 'Company not found' }, status: :not_found unless @company
      end
      
      def set_banner
        @banner = @company.banners.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Banner not found' }, status: :not_found
      end
      
      def check_banner_access!
        @access = FeatureAccessService.new(@company)
        
        unless @access.can?('banners')
          render json: { 
            error: 'Seu plano não inclui acesso a banners',
            upgrade_url: '/plans'
          }, status: :forbidden
        end
      end
      
      def within_limits?
        active_count = @company.banners.where(active: true).count
        max_allowed = @access.limit('banners', 'max_active_banners')
        active_count < max_allowed
      end
      
      def banner_limits
        {
          max_active_banners: @access.limit('banners', 'max_active_banners'),
          max_impressions_per_month: @access.limit('banners', 'max_impressions_per_month'),
          current_active: @company.banners.where(active: true).count,
          impressions_this_month: calculate_monthly_impressions,
          positions_allowed: @access.allowed_banner_positions,
          features: {
            ab_testing: @access.can?('banners', 'ab_testing'),
            advanced_targeting: @access.can?('banners', 'advanced_targeting'),
            priority_placement: @access.can?('banners', 'priority_placement')
          }
        }
      end
      
      def banner_params
        params.require(:banner).permit(
          :title, :link, :banner_type, :position, :category_id,
          :start_date, :end_date, :daily_budget, :alt_text, :image
        )
      end
      
      def calculate_avg_ctr
        banners = @company.banners
        total_impressions = banners.sum(:impressions_count)
        return 0 if total_impressions.zero?
        
        (banners.sum(:clicks_count).to_f / total_impressions * 100).round(2)
      end
      
      def calculate_monthly_spent
        @company.banner_transactions
          .charges
          .where('created_at >= ?', 1.month.ago)
          .sum(:amount)
      end
      
      def calculate_monthly_impressions
        start_of_month = Time.current.beginning_of_month
        @company.banner_impressions.where('created_at >= ?', start_of_month).count
      end
      
      def authenticate_company_user!
        unless current_user&.company
          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end
    end
  end
end
```

---

#### 3.2. Service de Analytics

```ruby
# app/services/banner_analytics_service.rb
class BannerAnalyticsService
  def initialize(banner)
    @banner = banner
  end
  
  def generate_report(period = 'week')
    range = time_range(period)
    
    {
      period: period,
      start_date: range.begin,
      end_date: range.end,
      overview: overview_stats(range),
      timeline: timeline_data(range, period),
      demographics: demographics_data(range),
      devices: devices_data(range),
      locations: locations_data(range),
      performance: performance_metrics
    }
  end
  
  private
  
  def time_range(period)
    case period
    when 'day'
      Time.current.beginning_of_day..Time.current.end_of_day
    when 'week'
      1.week.ago..Time.current
    when 'month'
      1.month.ago..Time.current
    when 'year'
      1.year.ago..Time.current
    else
      1.week.ago..Time.current
    end
  end
  
  def overview_stats(range)
    impressions = @banner.banner_impressions.where(created_at: range)
    clicks = @banner.banner_clicks.where(created_at: range)
    
    {
      impressions: impressions.count,
      clicks: clicks.count,
      ctr: calculate_ctr(impressions.count, clicks.count),
      unique_visitors: impressions.distinct.count(:session_id),
      cost: @banner.banner_transactions.charges.where(created_at: range).sum(:amount)
    }
  end
  
  def timeline_data(range, period)
    group_by = period == 'day' ? 'hour' : 'day'
    
    impressions = @banner.banner_impressions
      .where(created_at: range)
      .group_by_hour(:created_at, range: range)
      .count
      
    clicks = @banner.banner_clicks
      .where(created_at: range)
      .group_by_hour(:created_at, range: range)
      .count
    
    impressions.map do |time, count|
      {
        timestamp: time,
        impressions: count,
        clicks: clicks[time] || 0,
        ctr: calculate_ctr(count, clicks[time] || 0)
      }
    end
  end
  
  def demographics_data(range)
    # Placeholder - implementar quando houver dados de usuário
    {}
  end
  
  def devices_data(range)
    @banner.banner_impressions
      .where(created_at: range)
      .group(:device_type)
      .count
  end
  
  def locations_data(range)
    # Top 10 estados
    states = @banner.banner_impressions
      .where(created_at: range)
      .where.not(state: nil)
      .group(:state)
      .count
      .sort_by { |_, count| -count }
      .first(10)
      
    # Top 10 cidades
    cities = @banner.banner_impressions
      .where(created_at: range)
      .where.not(city: nil)
      .group(:city, :state)
      .count
      .sort_by { |_, count| -count }
      .first(10)
      
    {
      states: states.map { |state, count| { name: state, count: count } },
      cities: cities.map { |(city, state), count| { name: "#{city}, #{state}", count: count } }
    }
  end
  
  def performance_metrics
    {
      ctr: @banner.ctr,
      total_impressions: @banner.impressions_count,
      total_clicks: @banner.clicks_count,
      total_spent: @banner.total_spent,
      avg_cost_per_click: avg_cpc,
      avg_cost_per_impression: avg_cpi,
      budget_used_percentage: budget_usage_percentage
    }
  end
  
  def calculate_ctr(impressions, clicks)
    return 0 if impressions.zero?
    (clicks.to_f / impressions * 100).round(2)
  end
  
  def avg_cpc
    return 0 if @banner.clicks_count.zero?
    (@banner.total_spent / @banner.clicks_count).round(4)
  end
  
  def avg_cpi
    return 0 if @banner.impressions_count.zero?
    (@banner.total_spent / @banner.impressions_count).round(4)
  end
  
  def budget_usage_percentage
    return 0 if @banner.daily_budget.nil? || @banner.daily_budget.zero?
    ((@banner.total_spent / @banner.daily_budget) * 100).round(2)
  end
end
```

---

### Fase 4: Admin Interface para Planos

#### 4.1. Controller de Planos (Admin)

```ruby
# app/admin/plans.rb (ActiveAdmin)
ActiveAdmin.register Plan do
  permit_params :name, :description, :price, :features, features_json: {}
  
  index do
    selectable_column
    id_column
    column :name
    column :price do |plan|
      number_to_currency(plan.price)
    end
    column :companies_count do |plan|
      Company.where(plan_id: plan.id).count
    end
    column :created_at
    actions
  end
  
  show do
    attributes_table do
      row :name
      row :description
      row :price do |plan|
        number_to_currency(plan.price)
      end
      row :features
      row :features_json do |plan|
        pre JSON.pretty_generate(plan.features_json)
      end
      row :companies do |plan|
        Company.where(plan_id: plan.id).count
      end
      row :created_at
      row :updated_at
    end
    
    panel "Feature Matrix" do
      table_for [plan] do
        column "Dashboard" do
          plan.features_json.dig('dashboard', 'enabled') ? '✅' : '❌'
        end
        column "Banners" do
          max = plan.features_json.dig('banners', 'max_active_banners')
          max == -1 ? '∞' : max
        end
        column "Products" do
          max = plan.features_json.dig('content', 'max_products')
          max == -1 ? '∞' : max
        end
        column "Leads/Month" do
          max = plan.features_json.dig('leads', 'max_leads_per_month')
          max == -1 ? '∞' : max
        end
      end
    end
    
    panel "Companies Using This Plan" do
      table_for Company.where(plan_id: plan.id).limit(10) do
        column :name do |company|
          link_to company.name, admin_company_path(company)
        end
        column :status
        column :created_at
      end
    end
  end
  
  form do |f|
    f.inputs do
      f.input :name
      f.input :description
      f.input :price
      f.input :features, as: :text
    end
    
    f.inputs "Features JSON (Advanced)" do
      f.input :features_json, as: :text, 
        input_html: { 
          rows: 40,
          value: JSON.pretty_generate(f.object.features_json || default_features_json)
        },
        hint: "Configure features em formato JSON"
    end
    
    f.actions
  end
  
  # Action personalizada: Duplicar plano
  action_item :duplicate, only: :show do
    link_to "Duplicate Plan", duplicate_admin_plan_path(plan), method: :post
  end
  
  member_action :duplicate, method: :post do
    original = Plan.find(params[:id])
    new_plan = original.dup
    new_plan.name = "#{original.name} (Copy)"
    new_plan.save
    
    redirect_to admin_plan_path(new_plan), notice: "Plan duplicated successfully"
  end
  
  def default_features_json
    {
      "dashboard" => { "enabled" => true },
      "banners" => { "enabled" => true, "max_active_banners" => 2 },
      "content" => { "enabled" => true, "max_products" => 10 },
      "leads" => { "enabled" => true, "max_leads_per_month" => 100 }
    }
  end
end
```

---

#### 4.2. Interface Visual de Features (Admin SPA)

```tsx
// AB0-1-front/app/admin/plans/[id]/features/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PlanFeaturesEditor({ planId }: { planId: number }) {
  const [features, setFeatures] = useState(initialFeatures);
  const [saving, setSaving] = useState(false);
  
  const updateFeature = (section: string, key: string, value: any) => {
    setFeatures(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };
  
  const savePlan = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/plans/${planId}`, {
        features_json: features
      });
      toast.success('Plan updated successfully');
    } catch (error) {
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Dashboard Features */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Dashboard Features</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label>Enable Dashboard</label>
            <Switch 
              checked={features.dashboard.enabled}
              onCheckedChange={(checked) => updateFeature('dashboard', 'enabled', checked)}
            />
          </div>
          
          {features.dashboard.enabled && (
            <>
              <div className="flex items-center justify-between pl-6">
                <label>Analytics</label>
                <Switch 
                  checked={features.dashboard.features.analytics}
                  onCheckedChange={(checked) => 
                    updateFeature('dashboard', 'features', {
                      ...features.dashboard.features,
                      analytics: checked
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between pl-6">
                <label>Advanced Stats</label>
                <Switch 
                  checked={features.dashboard.features.advanced_stats}
                  onCheckedChange={(checked) => 
                    updateFeature('dashboard', 'features', {
                      ...features.dashboard.features,
                      advanced_stats: checked
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between pl-6">
                <label>Export Data</label>
                <Switch 
                  checked={features.dashboard.features.export_data}
                  onCheckedChange={(checked) => 
                    updateFeature('dashboard', 'features', {
                      ...features.dashboard.features,
                      export_data: checked
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* Banner Features */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Banner Features</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label>Enable Banners</label>
            <Switch 
              checked={features.banners.enabled}
              onCheckedChange={(checked) => updateFeature('banners', 'enabled', checked)}
            />
          </div>
          
          {features.banners.enabled && (
            <>
              <div className="space-y-2">
                <label>Max Active Banners</label>
                <Input 
                  type="number"
                  value={features.banners.max_active_banners}
                  onChange={(e) => updateFeature('banners', 'max_active_banners', parseInt(e.target.value))}
                  placeholder="-1 for unlimited"
                />
                <p className="text-sm text-gray-500">Use -1 for unlimited</p>
              </div>
              
              <div className="space-y-2">
                <label>Max Impressions Per Month</label>
                <Input 
                  type="number"
                  value={features.banners.max_impressions_per_month}
                  onChange={(e) => updateFeature('banners', 'max_impressions_per_month', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <label>Allowed Positions</label>
                <div className="flex flex-wrap gap-2">
                  {['sidebar', 'footer', 'categories_top', 'homepage', 'all'].map(pos => (
                    <Badge 
                      key={pos}
                      variant={features.banners.positions_allowed.includes(pos) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const positions = features.banners.positions_allowed;
                        const newPositions = positions.includes(pos)
                          ? positions.filter(p => p !== pos)
                          : [...positions, pos];
                        updateFeature('banners', 'positions_allowed', newPositions);
                      }}
                    >
                      {pos}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-2">Advanced Features</h3>
                
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <label>A/B Testing</label>
                    <Switch 
                      checked={features.banners.features.ab_testing}
                      onCheckedChange={(checked) => 
                        updateFeature('banners', 'features', {
                          ...features.banners.features,
                          ab_testing: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label>Advanced Targeting</label>
                    <Switch 
                      checked={features.banners.features.advanced_targeting}
                      onCheckedChange={(checked) => 
                        updateFeature('banners', 'features', {
                          ...features.banners.features,
                          advanced_targeting: checked
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label>Priority Placement</label>
                    <Switch 
                      checked={features.banners.features.priority_placement}
                      onCheckedChange={(checked) => 
                        updateFeature('banners', 'features', {
                          ...features.banners.features,
                          priority_placement: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* Content Features */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Content Features</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label>Enable Content Management</label>
            <Switch 
              checked={features.content.enabled}
              onCheckedChange={(checked) => updateFeature('content', 'enabled', checked)}
            />
          </div>
          
          {features.content.enabled && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label>Max Products</label>
                  <Input 
                    type="number"
                    value={features.content.max_products}
                    onChange={(e) => updateFeature('content', 'max_products', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label>Max Media Files</label>
                  <Input 
                    type="number"
                    value={features.content.max_media_files}
                    onChange={(e) => updateFeature('content', 'max_media_files', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label>Max Articles</label>
                  <Input 
                    type="number"
                    value={features.content.max_articles}
                    onChange={(e) => updateFeature('content', 'max_articles', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={savePlan} disabled={saving}>
          {saving ? 'Saving...' : 'Save Plan'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 📋 ROADMAP DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2): Foundation
- ✅ Migrations (banners, impressions, clicks, transactions)
- ✅ Modelos atualizados
- ✅ Seeds com planos de exemplo
- ✅ Testes básicos

**Entregas:**
- Banners vinculados a companies
- Analytics tracking preparado
- Planos com features_json

---

### Sprint 2 (Semana 3-4): Company Dashboard (Banners)
- ✅ Controller de banners para companies
- ✅ Frontend: Listagem de banners
- ✅ Frontend: Formulário de criação
- ✅ Frontend: Dashboard de analytics

**Entregas:**
- Companies podem criar banners
- Workflow de aprovação funcional
- Analytics básico visível

---

### Sprint 3 (Semana 5-6): Admin Features Management
- ✅ Admin interface para planos
- ✅ Feature editor visual
- ✅ Preview de features por plano
- ✅ Bulk actions para companies

**Entregas:**
- Admin pode configurar features
- Empresas veem features do plano
- Limites sendo respeitados

---

### Sprint 4 (Semana 7-8): Analytics Avançado
- ✅ Tracking real de impressões/cliques
- ✅ Dashboard de analytics completo
- ✅ Relatórios exportáveis
- ✅ Alertas de budget

**Entregas:**
- Analytics em tempo real
- Gráficos e visualizações
- Exports em PDF/CSV

---

### Sprint 5 (Semana 9-10): Billing & Monetização
- ✅ Sistema de créditos
- ✅ Checkout de créditos
- ✅ Billing automático
- ✅ Invoices

**Entregas:**
- Empresas podem comprar créditos
- Cobrança automática funcional
- Invoices gerados

---

### Sprint 6 (Semana 11-12): Polish & Launch
- ✅ Testes E2E
- ✅ Performance optimization
- ✅ Documentação
- ✅ Onboarding

**Entregas:**
- Sistema completo em produção
- Documentação para empresas
- Materiais de marketing

---

## 💰 ESTIMATIVA DE CUSTOS

### Desenvolvimento
- 3 Desenvolvedores × 3 meses: R$ 135.000
- 1 Designer × 1 mês: R$ 15.000
- 1 QA × 1 mês: R$ 12.000
- **Total Dev:** R$ 162.000

### Infraestrutura (Primeiro Ano)
- Analytics/Tracking: R$ 1.000/mês = R$ 12.000
- CDN para banners: R$ 500/mês = R$ 6.000
- Database upgrade: R$ 2.000
- **Total Infra:** R$ 20.000

### **TOTAL:** R$ 182.000

---

## 📈 PROJEÇÃO DE RECEITA

### Cenário Conservador (Ano 1)

| Plano | Preço/mês | Companies | MRR | ARR |
|-------|-----------|-----------|-----|-----|
| Starter | R$ 299 | 30 | R$ 8.970 | R$ 107.640 |
| Professional | R$ 799 | 15 | R$ 11.985 | R$ 143.820 |
| Enterprise | R$ 2.499 | 5 | R$ 12.495 | R$ 149.940 |
| **TOTAL** | - | **50** | **R$ 33.450** | **R$ 401.400** |

### ROI
- **Investimento:** R$ 182.000
- **Payback:** 6 meses
- **ROI Ano 1:** 120%

---

## 🚀 CONCLUSÃO

Este plano oferece:

1. ✅ **Sem Breaking Changes** - Tudo é backward compatible
2. ✅ **Escalável** - Arquitetura preparada para crescimento
3. ✅ **Flexível** - Features configuráveis via JSON
4. ✅ **Monetizável** - Sistema completo de billing
5. ✅ **Enterprise-Ready** - Padrões de código profissionais

**Próximos Passos:**
1. Aprovação do roadmap
2. Definição de prioridades
3. Início do Sprint 1

---

**Preparado por:** Senior Solutions Architect  
**Data:** 2024-12-25  
**Versão:** 1.0  
**Status:** Pronto para implementação
