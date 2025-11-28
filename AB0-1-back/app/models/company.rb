class Company < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching

  enum status: {
    active: 'active',
    inactive: 'inactive',
    pending: 'pending',
    blocked: 'blocked'
  }, _suffix: true

  # =========================
  # Attachments
  # =========================
  has_one_attached :banner
  has_one_attached :logo
  has_many_attached :media_assets

  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :categories, join_table: :categories_companies
  has_many :reviews, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  belongs_to :plan, optional: true

  # =========================
  # Validations
  # =========================
  validates :name, :description, presence: true
  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validates :website,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'must be a valid URL' },
            allow_blank: true
  validates :phone,
            format: { with: /\A\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}\z/,
                      message: 'must be in format (XX) XXXX-XXXX or (XX) XXXXX-XXXX' },
            allow_blank: true
  validates :whatsapp,
            format: { with: /\A\+?[0-9]{10,15}\z/,
                      message: 'must be a valid WhatsApp number' },
            allow_blank: true
  validates :email_public,
            format: { with: URI::MailTo::EMAIL_REGEXP,
                      message: 'must be a valid email' },
            allow_blank: true
  validates :whatsapp_url,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'deve ser uma URL válida (ex: https://wa.me/)' },
            if: :whatsapp_enabled?,
            allow_blank: true

  # =========================
  # Scopes
  # =========================
  scope :by_state,        ->(state) { where(state:) if state.present? }
  scope :by_city,         ->(city)  { where(city:) if city.present? }
  scope :featured,        ->        { where(featured: true) }
  scope :verified,        ->        { where(verified: true) }
  scope :by_rating,       ->        { order(rating_avg: :desc) }
  scope :by_founded_year, ->        { order(founded_year: :asc) }
  scope :active_only,     ->        { where(status: statuses[:active]) }

  # =========================
  # Cacheable Queries - TASK-016
  # =========================

  # Featured companies with best ratings
  cacheable_query :featured_top_rated, expires_in: 1.hour do
    featured
      .active_only
      .verified
      .by_rating
      .includes(:categories, :products)
      .limit(10)
  end

  # Active companies with products
  cacheable_query :active_with_products, expires_in: 30.minutes do
    active_only
      .joins(:products)
      .distinct
      .includes(:categories)
      .order(name: :asc)
  end

  # Companies by state (cached)
  def self.cached_by_state(state, expires_in: 30.minutes)
    return [] if state.blank?

    cache_key = "company/by_state/#{state}"
    Rails.cache.fetch(cache_key, expires_in: expires_in) do
      by_state(state).active_only.to_a
    end
  end

  # Companies by city (cached)
  def self.cached_by_city(city, expires_in: 30.minutes)
    return [] if city.blank?

    cache_key = "company/by_city/#{city}"
    Rails.cache.fetch(cache_key, expires_in: expires_in) do
      by_city(city).active_only.to_a
    end
  end

  # Top rated companies
  cacheable_query :top_rated, expires_in: 1.hour do
    where.not(rating_avg: nil)
      .where('rating_avg >= ?', 4.0)
      .active_only
      .by_rating
      .limit(20)
  end

  # =========================
  # Ransack configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description website phone address state city
      featured verified cnpj email_public instagram facebook linkedin
      working_hours payment_methods certifications status
      founded_year employees_count rating_avg rating_count
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[categories reviews]
  end

  # =========================
  # Domain / API helpers
  # =========================

  # Cached average rating
  def average_rating
    cache_method(:average_rating, expires_in: 30.minutes) do
      rating_avg.presence || reviews.average(:rating).to_f.round(1)
    end
  end

  # Cached reviews count
  def reviews_count
    cache_method(:reviews_count, expires_in: 30.minutes) do
      rating_count.presence || reviews.count
    end
  end

  # Cached products count
  def cached_products_count
    cache_method(:products_count, expires_in: 1.hour) do
      products.count
    end
  end

  # Cached categories
  def cached_categories
    cache_method(:categories, expires_in: 1.hour) do
      categories.to_a
    end
  end

  def recalculate_rating_cache!
    stats = reviews.group(nil).pluck(Arel.sql('COALESCE(AVG(rating),0), COUNT(*)')).first
    avg = stats[0].to_f.round(2)
    count = stats[1].to_i
    update_columns(rating_avg: avg, rating_count: count, updated_at: Time.current)

    # Clear cache after recalculation
    clear_cache!
  end

  def years_in_business
    return nil unless founded_year.present?

    Time.current.year - founded_year
  end

  def build_ctas(context = 'detail', utm = {}, vars = {})
    CompanyCtaBuilder.new(self, context, utm, vars).build_all_ctas
  end

  def social_links
    {
      facebook: facebook_url,
      instagram: instagram_url,
      linkedin: linkedin_url,
      youtube: youtube_url
    }.compact.presence
  end

  # Helper methods for Active Storage URLs
  def banner_url
    banner.attached? ? Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false) : nil
  end

  def logo_url
    logo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(logo, only_path: false) : nil
  end

  def media_urls
    media_assets.attached? ? media_assets.map { |m| Rails.application.routes.url_helpers.rails_blob_url(m, only_path: false) } : []
  end

  def whatsapp_url
    super.presence || (whatsapp.present? ? "https://wa.me/#{whatsapp.gsub(/[^0-9]/, '')}" : nil)
  end

  def has_paid_plan?
    return false unless plan_status == 'active' && plan.present?
    plan.price.to_f > 0.0
  end

  def max_products_limit
    features = plan&.features_json || {}
    limit = features.is_a?(Hash) ? (features['max_products'] || features[:max_products]) : nil
    limit.is_a?(Integer) ? limit : nil
  end

  validate :validate_logo_attachment
  validate :validate_banner_attachment
  
  # Constantes (mantidas no modelo)
  PROJECT_TYPES = %w[Residenciais Comerciais Rurais].freeze
  SERVICES_OFFERED = [
    'Instalação Residencial',
    'Instalação Comercial',
    'Instalação Industrial',
    'Manutenção e Suporte',
    'Consultoria Energética'
  ].freeze

  # Atributos virtuais para ActiveAdmin
  attr_accessor :project_types, :services_offered

  before_validation :normalize_multiselects
  validate :validate_project_types, :validate_services_offered

  def validate_logo_attachment
    return unless logo.attached?
    if !logo.blob.content_type.in?(%w[image/png image/jpeg])
      errors.add(:logo, 'deve ser PNG ou JPG')
    end
    if logo.blob.byte_size > 2.megabytes
      errors.add(:logo, 'tamanho máximo é 2MB')
    end
  end

  def validate_banner_attachment
    return unless banner.attached?
    if !banner.blob.content_type.in?(%w[image/png image/jpeg])
      errors.add(:banner, 'deve ser PNG ou JPG')
    end
    if banner.blob.byte_size > 5.megabytes
      errors.add(:banner, 'tamanho máximo é 5MB')
    end
    begin
      banner.blob.analyze unless banner.blob.analyzed?
      meta = banner.blob.metadata || {}
      w = meta['width']
      h = meta['height']
      if w && h && (w < 1920 || h < 600)
        errors.add(:banner, 'dimensões mínimas recomendadas: 1920x600px')
      end
    rescue => e
      Rails.logger.warn "Falha ao analisar dimensões do banner: #{e.message}"
    end
  end
  
  # MÉTODOS DE VALIDAÇÃO (Corrigidos para usar self.)
  def validate_project_types
    # O erro 'undefined local variable' acontece aqui se não usarmos 'self.' ou se o atributo não estiver definido.
    # Usando 'self.project_types' resolve o escopo.
    return if self.project_types.blank? 
    invalid = Array(self.project_types) - PROJECT_TYPES
    errors.add(:project_types, "valores inválidos: #{invalid.join(', ')}") if invalid.any?
  end

  def validate_services_offered
    return if self.services_offered.blank?
    invalid = Array(self.services_offered) - SERVICES_OFFERED
    errors.add(:services_offered, "valores inválidos: #{invalid.join(', ')}") if invalid.any?
  end

  def normalize_multiselects
    if respond_to?(:project_types)
      self.project_types = Array(self.project_types).map { |v| v.to_s.strip }.reject(&:blank?)
    end
    if respond_to?(:services_offered)
      self.services_offered = Array(self.services_offered).map { |v| v.to_s.strip }.reject(&:blank?)
    end
  end

  # Analytics methods
  def profile_views_on(date)
    analytics_events
      .by_type('view')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end

  def cta_clicks_on(date)
    analytics_events
      .by_type('click')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end

  def historical_stats(days = 30)
    Rails.cache.fetch("company_#{id}_historical_#{days}_days", expires_in: 1.hour) do
      calculate_historical_stats(days)
    end
  end

  private

  def calculate_historical_stats(days)
    # Implementation...
  end
end