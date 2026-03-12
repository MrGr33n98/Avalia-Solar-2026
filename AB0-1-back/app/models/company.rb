require 'securerandom'

class Company < ApplicationRecord
  include PgSearch::Model
  include QueryCacheable # TASK-016: Query Caching
  include Moderation

  has_paper_trail # Enable rollback capabilities

  ALLOWED_LOGO_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/svg+xml image/webp].freeze
  ALLOWED_BANNER_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/svg+xml image/webp].freeze
  ALLOWED_MEDIA_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/svg+xml image/webp].freeze
  LOGO_MAX_SIZE = 5.megabytes
  BANNER_MAX_SIZE = 10.megabytes
  MEDIA_MAX_SIZE = 15.megabytes
  SECTOR_QUESTIONS_FREE_LIMIT = 2
  INTENT_TIERS = %w[free pro enterprise].freeze

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
  has_one_attached :verified_badge # TASK: Trust Widget Badge
  has_many_attached :media_assets

  validate :verified_badge_validation

  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :categories, join_table: :categories_companies,
                                      after_add: :update_category_metrics,
                                      after_remove: :update_category_metrics

  def update_category_metrics(category)
    category.update_metrics! if category.respond_to?(:update_metrics!)
  end

  has_many :reviews, dependent: :destroy
  has_many :review_aggregates, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :lead_distributions, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  has_many :company_buttons, dependent: :destroy
  accepts_nested_attributes_for :company_buttons, allow_destroy: true
  has_many :financing_options, dependent: :destroy
  accepts_nested_attributes_for :financing_options, allow_destroy: true
  has_many :company_faqs, dependent: :destroy
  accepts_nested_attributes_for :company_faqs, allow_destroy: true
  has_one :company_financing_profile, dependent: :destroy
  has_many :company_financing_partners, dependent: :destroy
  has_many :company_financing_offers, dependent: :destroy
  has_many :banners, dependent: :nullify
  has_many :banner_events, dependent: :nullify
  has_many :banner_subscriptions, dependent: :destroy
  has_many :company_videos, dependent: :destroy
  has_and_belongs_to_many :articles
  belongs_to :plan, optional: true
  has_many :users, dependent: :nullify
  has_many :company_members, dependent: :destroy
  has_many :company_badges, dependent: :destroy
  has_many :badges, through: :company_badges
  has_many :company_access_requests, dependent: :destroy
  has_many :company_webhooks, dependent: :destroy
  has_many :gated_downloads, dependent: :destroy
  has_many :sector_ratings, dependent: :destroy
  has_many :company_sector_questions, dependent: :destroy
  accepts_nested_attributes_for :company_sector_questions, allow_destroy: true
  accepts_nested_attributes_for :company_members, allow_destroy: true
  has_many :members, through: :company_members, source: :user

  # =========================
  # Callbacks
  # =========================
  attr_accessor :category_ids_for_metrics_update

  before_save :capture_category_ids_for_metrics, prepend: true
  after_save :update_associated_categories_metrics
  after_save :invalidate_companies_cache
  after_destroy :invalidate_companies_cache
  # after_commit :update_associated_categories_metrics, on: [:create, :update, :destroy]

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, length: { minimum: 2 }
  validates :description, presence: true
  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validate :validate_cnpj_format
  validate :validate_state_in_dataset
  validate :validate_city_in_dataset
  validate :validate_ticket_range
  validate :validate_ready_for_activation, if: -> { status == 'active' }
  validate :validate_featured_requires_active
  validate :validate_category_ids_format
  validate :validate_attachments

  validates :website,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'must be a valid URL' },
            allow_blank: true
  validates :phone,
            format: { with: /\A\d{10,15}\z/,
                      message: 'must contain only digits (DDD + nÃƒÂºmero)' },
            allow_blank: true

  validates :whatsapp,
            format: { with: /\A\d{10,15}\z/,
                      message: 'must be a valid WhatsApp number' },
            allow_blank: true

  SIMPLE_EMAIL_REGEX = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  validates :email,
            format: { with: SIMPLE_EMAIL_REGEX,
                      message: 'must be a valid email' },
            allow_blank: true
  validates :email_public,
            format: { with: SIMPLE_EMAIL_REGEX,
                      message: 'must be a valid email' },
            allow_blank: true

  validates :whatsapp_url,
            presence: true,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'deve ser uma URL vÃƒÂ¡lida (ex: https://wa.me/)' },
            if: :whatsapp_enabled?,
            allow_blank: false

  validates :minimum_ticket,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true
  validates :maximum_ticket,
            numericality: { greater_than_or_equal_to: 0 },
            allow_nil: true
  validates :slug, presence: true, uniqueness: true

  # Validate that minimum_ticket is less than maximum_ticket if both are present
  def validate_ticket_range
    return if minimum_ticket.blank? || maximum_ticket.blank?

    return unless minimum_ticket > maximum_ticket

    errors.add(:minimum_ticket, 'deve ser menor ou igual ao ticket mÃƒÂ¡ximo')
  end

  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :featured, -> { where(featured: true) }
  scope :verified, -> { where(verified: true) }
  scope :by_state, ->(state) { where(state: state) if state.present? }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :ordered, -> { order(featured: :desc, rating_avg: :desc, name: :asc) }

  # Full Text Search Scope
  scope :search_by_text, ->(query) {
    return all if query.blank?

    # to_tsvector logic matching the migration index
    tsvector = <<-SQL
      to_tsvector('portuguese',
        coalesce(name, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(city, '') || ' ' ||
        coalesce(state, '')
      )
    SQL

    # plainto_tsquery for safe input handling
    where("#{tsvector} @@ plainto_tsquery('portuguese', ?)", query)
  }
  
  # Sprint 1 Ranking Engine
  scope :ordered_by_priority, -> {
    order(Arel.sql("
      CASE WHEN sponsored THEN 1 ELSE 0 END DESC,
      (COALESCE(rating_avg, 0) * 0.6 + COALESCE(rating_count, 0) * 0.0001 + priority_score) DESC,
      COALESCE(rating_avg, 0) DESC,
      COALESCE(rating_count, 0) DESC,
      name ASC
    "))
  }

  def calculate_ranking_score
    # Fórmula base: (Avaliação * 60%) + (Volume de reviews irrelevante para peso mas útil para empate) + Score de Prioridade + Bônus de Patrocínio
    # sponsored ? 1000 : 0 garante que patrocinados fiquem no topo se o priority_score for similar
    (rating_avg.to_f * 0.6) + (rating_count * 0.0001) + priority_score + (sponsored ? 1000 : 0)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[name description status state city featured verified cnpj founded_year
       employees_count rating_avg created_at updated_at plan_id moderation_status active_admin social_proof_enabled]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[
      categories products reviews leads campaigns
      company_buttons financing_options company_faqs
      company_financing_profile company_financing_partners
      company_financing_offers banners banner_subscriptions
      company_videos plan company_members members
    ]
  end

  def average_rating
    rating_avg
  end

  def rating_count
    self[:rating_count] || 0
  end

  def recalculate_rating_cache!
    Reviews::AggregationService.new(self, nil).recalculate!
    categories.each(&:update_metrics!)
  end

  def recalculate_sector_rating_cache!
    summary = sector_ratings.published
    avg = summary.average(:total_score).to_f.round(2)
    count = summary.count
    update_columns(sector_rating_avg: avg, sector_rating_count: count)
  end

  def to_s
    name
  end

  def to_param
    slug.presence || super
  end

  def self.find_by_slug_or_id!(id_or_slug)
    find_by(id: id_or_slug) || find_by!(slug: id_or_slug)
  end

  def ready_for_activation?
    return false if name.blank? || name.length < 2
    return false if email.blank? || !SIMPLE_EMAIL_REGEX.match?(email)
    return false unless Locations::BrLocations.valid_state?(state)
    return false unless Locations::BrLocations.valid_city?(state, city)
    return false unless categories.any?
    return false unless phone.present? || whatsapp.present? || email_public.present?

    true
  end

  def validate_ready_for_activation
    errors.add(:name, 'ÃƒÂ© obrigatÃƒÂ³rio para ativaÃƒÂ§ÃƒÂ£o (mÃƒÂ­nimo 2 caracteres)') if name.blank? || name.length < 2

    errors.add(:email, 'invÃƒÂ¡lido ou ausente para ativaÃƒÂ§ÃƒÂ£o') if email.blank? || !SIMPLE_EMAIL_REGEX.match?(email)

    errors.add(:state, 'invÃƒÂ¡lido ou ausente para ativaÃƒÂ§ÃƒÂ£o') unless Locations::BrLocations.valid_state?(state)

    errors.add(:city, 'invÃƒÂ¡lida ou ausente para ativaÃƒÂ§ÃƒÂ£o') unless Locations::BrLocations.valid_city?(state, city)

    errors.add(:categories, 'pelo menos uma categoria ÃƒÂ© necessÃƒÂ¡ria para ativaÃƒÂ§ÃƒÂ£o') unless categories.any?

    return if phone.present? || whatsapp.present? || email_public.present?

    errors.add(:base, 'Pelo menos um contato (Telefone, WhatsApp ou Email PÃƒÂºblico) ÃƒÂ© necessÃƒÂ¡rio para ativaÃƒÂ§ÃƒÂ£o')
  end

  def validate_featured_requires_active
    return unless featured
    return if status == 'active'

    errors.add(:featured, 'sÃƒÂ³ pode ser verdadeiro quando o status ÃƒÂ© active')
  end

  # FIX #6: Adicionar validaÃƒÂ§ÃƒÂ£o robusta de category_ids format em Company
  def validate_category_ids_format
    # We use raw category_ids if available, or just check the association
    # Active Record's category_ids usually returns an array.
    # But when receiving from API, it might be anything.

    # If it's nil, it's fine (might be handled by presence validation elsewhere)
    return if category_ids.nil?

    unless category_ids.is_a?(Array)
      errors.add(:category_ids, 'formato invÃƒÂ¡lido: deve ser um array')
      return
    end

    return unless category_ids.any? { |id| id.to_s.present? && !id.to_s.match?(/\A\d+\z/) }

    errors.add(:category_ids, 'contÃƒÂ©m identificadores invÃƒÂ¡lidos')
  end

  def normalize_company_fields
    self.state = state.to_s.strip.upcase if state.present?
    self.city = city.to_s.strip.gsub(/\s+/, ' ') if city.present?
    self.email = email.to_s.strip.downcase if email.present?
    self.email_public = email_public.to_s.strip.downcase if email_public.present?
    self.cnpj = normalize_cnpj_value(cnpj)
    self.phone = normalize_phone_value(phone)
    self.phone_alt = normalize_phone_value(phone_alt)
    self.whatsapp = normalize_phone_value(whatsapp)

    return unless whatsapp.present? && whatsapp_url.blank?

    digits = whatsapp.to_s
    digits = digits.sub(/\A55/, '') if digits.length > 11
    self.whatsapp_url = "https://wa.me/55#{digits}"
  end

  def normalize_phone_value(value)
    digits = value.to_s.gsub(/\D/, '')
    digits.presence
  end

  def normalize_cnpj_value(value)
    digits = value.to_s.gsub(/\D/, '')
    digits.presence
  end

  def normalize_multiselects
    self.project_types = Array(project_types).map { |v| v.to_s.strip }.reject(&:blank?) if respond_to?(:project_types)
    self.niche_tags = Array(niche_tags).map { |v| v.to_s.strip }.reject(&:blank?) if respond_to?(:niche_tags)
    return unless respond_to?(:services_offered)

    self.services_offered = Array(services_offered).map { |v| v.to_s.strip }.reject(&:blank?)
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

  def validate_attachments
    validate_logo_attachment if logo.attached?
    validate_banner_attachment if banner.attached?
    validate_media_assets_attachments if media_assets.attached?
  end

  def validate_media_assets_attachments
    media_assets.each do |asset|
      validate_blob_type_and_size(
        attribute: :media_assets,
        blob: asset.blob,
        allowed_types: ALLOWED_MEDIA_CONTENT_TYPES,
        max_size: MEDIA_MAX_SIZE,
        invalid_type_message: "arquivo #{asset.filename} deve ser JPG, PNG, SVG ou WEBP",
        invalid_size_message: "arquivo #{asset.filename} excede o limite de 15MB"
      )
    end
  end

  def validate_logo_attachment
    return unless logo.attached?

    validate_blob_type_and_size(
      attribute: :logo,
      blob: logo.blob,
      allowed_types: ALLOWED_LOGO_CONTENT_TYPES,
      max_size: LOGO_MAX_SIZE,
      invalid_type_message: 'deve ser PNG, JPG, SVG ou WEBP',
      invalid_size_message: 'tamanho mÃƒÂ¡ximo ÃƒÂ© 5MB'
    )
    validate_minimum_dimensions(
      attribute: :logo,
      blob: logo.blob,
      min_width: 100,
      min_height: 100,
      recommendation: '200x200px'
    )
  end

  def validate_banner_attachment
    return unless banner.attached?

    validate_blob_type_and_size(
      attribute: :banner,
      blob: banner.blob,
      allowed_types: ALLOWED_BANNER_CONTENT_TYPES,
      max_size: BANNER_MAX_SIZE,
      invalid_type_message: 'deve ser PNG, JPG, SVG ou WEBP',
      invalid_size_message: 'tamanho mÃƒÂ¡ximo ÃƒÂ© 10MB'
    )
    validate_minimum_dimensions(
      attribute: :banner,
      blob: banner.blob,
      min_width: 800,
      min_height: 200,
      recommendation: '1200x400px'
    )
  end

  # Constantes (mantidas no modelo)
  PROJECT_TYPES = %w[Residenciais Comerciais Rurais].freeze
  SERVICES_OFFERED = [
    'Estudo Econômico',
    'Projeto',
    'Instalação',
    'Homologação',
    'Monitoramento',
    'Manutenção e Assistência Técnica'
  ].freeze

  before_validation :normalize_company_fields
  before_validation :normalize_multiselects
  before_validation :ensure_slug
  validate :validate_project_types, :validate_services_offered, :validate_niche_tags

  NICHE_TAGS = [
    'Especialista em Condomínios',
    'Projetos Rurais',
    'Industrial e Usinas',
    'Mobilidade Elétrica',
    'Baterias e Off-Grid'
  ].freeze

  def validate_niche_tags
    return if self.niche_tags.blank?
    invalid = Array(self.niche_tags) - NICHE_TAGS
    errors.add(:niche_tags, "valores inválidos: #{invalid.join(', ')}") if invalid.any?
  end

  # MÃƒâ€°TODOS DE VALIDAÃƒâ€¡ÃƒÆ’O (Corrigidos para usar self.)
  def validate_project_types
    # O erro 'undefined local variable' acontece aqui se nÃƒÂ£o usarmos 'self.' ou se o atributo nÃƒÂ£o estiver definido.
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

  def validate_cnpj_format
    return if cnpj.blank?

    return if CNPJ.valid?(cnpj)

    errors.add(:cnpj, 'invÃƒÂ¡lido')
  end

  def validate_state_in_dataset
    return if state.blank?
    return if Locations::BrLocations.valid_state?(state)

    errors.add(:state, 'invÃƒÂ¡lido')
  end

  def validate_city_in_dataset
    return if city.blank?

    if state.blank?
      errors.add(:city, 'requer um estado vÃƒÂ¡lido')
      return
    end

    return if Locations::BrLocations.valid_city?(state, city)

    errors.add(:city, 'invÃƒÂ¡lida para o estado selecionado')
  end

  def has_paid_plan?
    return false unless respond_to?(:plan) && plan.present?

    status_allows_plan =
      if respond_to?(:plan_status)
        plan_status.blank? || plan_status == 'active'
      else
        true
      end

    status_allows_plan && plan.price.to_f.positive?
  end

  def can_use_social_proof?
    return false if respond_to?(:social_proof_enabled) && social_proof_enabled == false

    explicit_flag = explicit_feature_value_from_plan?(
      :social_proof,
      :social_proof_enabled,
      :social_proof_feature,
      :featured_reviews
    )
    return explicit_flag unless explicit_flag.nil?

    return true if respond_to?(:social_proof_enabled) && social_proof_enabled == true

    feature_enabled_from_plan?(
      :social_proof,
      :social_proof_enabled,
      :social_proof_feature,
      :featured_reviews,
      include_defaults: true
    )
  rescue StandardError
    has_paid_plan?
  end

  # Attribute-style helper for serializers/front usage.
  def can_use_social_proof
    can_use_social_proof?
  end

  def quote_feature_enabled?
    explicit_flag = explicit_feature_value_from_plan?(
      :custom_ctas,
      :active_admin,
      :quote_feature,
      :quote_feature_enabled,
      :quote_requests,
      :quote_requests_enabled
    )
    return explicit_flag unless explicit_flag.nil?

    return true if respond_to?(:active_admin) && active_admin

    feature_enabled_from_plan?(
      :custom_ctas,
      :active_admin,
      :quote_feature,
      :quote_feature_enabled,
      :quote_requests,
      :quote_requests_enabled,
      include_defaults: true
    ) == true
  end

  # Backward-compatible CTA aliases used by API payloads and serializers.
  def cta_whatsapp_enabled
    return false unless quote_feature_enabled?

    whatsapp_enabled?
  end

  def cta_whatsapp_url
    return nil unless cta_whatsapp_enabled

    respond_to?(:whatsapp_url) ? whatsapp_url : nil
  end

  def financing_feature_allowed?
    explicit_flag = explicit_feature_value_from_plan?(:financing_simulation, :financing, :financing_tab_visible)
    return explicit_flag unless explicit_flag.nil?

    return true if respond_to?(:financing_tab_visible) && financing_tab_visible

    feature_enabled_from_plan?(:financing_simulation, :financing, :financing_tab_visible, include_defaults: true)
  rescue StandardError
    has_paid_plan?
  end

  def media_upload_allowed?
    explicit_flag = explicit_feature_value_from_plan?(:media_upload, :media_gallery, :allow_media_uploads, :gallery_uploads, :media)
    return explicit_flag unless explicit_flag.nil?

    return true if featured? || verified?

    feature_enabled_from_plan?(:media_upload, :media_gallery, :allow_media_uploads, :gallery_uploads, :media, include_defaults: true)
  rescue StandardError
    featured? || verified? || has_paid_plan?
  end

  # Expose without question mark for serializers expecting an attribute-style method
  def media_upload_allowed
    media_upload_allowed?
  end

  def sector_question_limit
    explicit = feature_value_from_plan(:sector_question_limit, :sector_questions_limit)
    explicit_limit = explicit.to_i if explicit.present?
    return explicit_limit if explicit_limit.to_i.positive?

    has_paid_plan? ? 10 : SECTOR_QUESTIONS_FREE_LIMIT
  rescue StandardError
    SECTOR_QUESTIONS_FREE_LIMIT
  end

  def requires_paid_plan_for_sector_question?(new_count: nil)
    count = new_count || company_sector_questions.count
    return false if count <= SECTOR_QUESTIONS_FREE_LIMIT || has_paid_plan?

    true
  end

  def sector_question_limit_reached?(new_count: nil)
    count = new_count || company_sector_questions.count
    count > sector_question_limit
  rescue StandardError
    false
  end

  def can_manage_sector_questions?
    respond_to?(:sector_ratings_enabled?) && sector_ratings_enabled?
  end

  # Public feature hash used by dashboard and serializers.
  def effective_plan_features
    PlanFeatureCatalog.normalize(raw_effective_plan_features, plan_tier: inferred_plan_tier)
  rescue StandardError => e
    Rails.logger.error("[Company#effective_plan_features] company_id=#{id} error=#{e.class}: #{e.message}")
    {}
  end

  def resolved_plan_features
    return @resolved_plan_features if defined?(@resolved_plan_features)

    @resolved_plan_features = effective_plan_features
  rescue StandardError
    @resolved_plan_features = {}
  end

  def explicit_feature_value_from_plan(*keys)
    keys.flatten.each do |key|
      value = PlanFeatureCatalog.explicit_value(raw_effective_plan_features, key)
      return value unless value.nil?
    end
    nil
  end

  def explicit_feature_value_from_plan?(*keys)
    value = explicit_feature_value_from_plan(*keys)
    return nil if value.nil?

    ActiveModel::Type::Boolean.new.cast(value)
  end

  def feature_enabled_from_plan?(*keys, include_defaults: true)
    value = feature_value_from_plan(*keys, include_defaults: include_defaults)
    return nil if value.nil?

    ActiveModel::Type::Boolean.new.cast(value)
  end

  def feature_value_from_plan(*keys, include_defaults: true)
    features = include_defaults ? resolved_plan_features : PlanFeatureCatalog.normalize(raw_effective_plan_features, apply_defaults: false)
    keys.flatten.each do |key|
      value = features[key.to_s]
      return value unless value.nil?

      value = features[key.to_sym]
      return value unless value.nil?

      canonical_key = PlanFeatureCatalog.canonical_key_for(key)
      value = features[canonical_key]
      return value unless value.nil?
    end
    nil
  end

  def feature_access
    @feature_access ||= CompanyFeatureAccessResolver.call(company: self)
  rescue StandardError => e
    Rails.logger.error("[Company#feature_access] company_id=#{id} error=#{e.class}: #{e.message}")
    {}
  end

  def inferred_plan_tier
    return plan.inferred_plan_tier if plan.respond_to?(:inferred_plan_tier)

    has_paid_plan? ? 'pro' : 'free'
  rescue StandardError
    'free'
  end

  def financing_tab_visible?
    financing_tab_visible
  end

  def whatsapp_enabled?
    # Ensure it returns a boolean even if the column is missing
    return false unless respond_to?(:whatsapp_enabled)

    !!whatsapp_enabled
  end

  def banner_url
    generate_attachment_url(banner)
  end

  def logo_url
    generate_attachment_url(logo)
  end

  def verified_badge_image_url
    generate_attachment_url(verified_badge)
  end

  def verified_badge_url
    verified_badge_image_url
  end

  def media_urls
    return [] unless media_assets.attached?

    media_assets.filter_map do |asset|
      generate_attachment_url(asset)
    end
  end

  def published_videos
    company_videos.where(status: 'published').order(created_at: :desc)
  end

  def calculate_historical_stats(days)
    end_date = Date.current
    start_date = end_date - days.days

    stats = company_daily_stats.where(day: start_date..end_date).order(day: :asc)

    {
      dates: stats.map { |s| s.day.strftime('%d/%m') },
      views: stats.map(&:profile_views),
      leads: stats.map(&:leads),
      clicks: stats.map(&:cta_clicks)
    }
  end

  after_update_commit :track_activation_event, if: :saved_change_to_status?
  after_update_commit :track_plan_change_event, if: :saved_change_to_plan_id?

  private

  def track_plan_change_event
    # Enqueue async job instead of synchronous call
    Analytics::TrackEventJob.perform_later(
      company_id: id,
      event_type: 'plan_changed',
      metadata: {
        previous_plan_id: plan_id_before_last_save,
        new_plan_id: plan_id,
        status: plan_status
      }
    )
  rescue StandardError => e
    Rails.logger.error("[Analytics] Failed to enqueue plan change tracking: #{e.message}")
  end

  def track_activation_event
    return unless status == 'active' && status_before_last_save != 'active'

    # Enqueue async job instead of synchronous call
    Analytics::TrackEventJob.perform_later(
      company_id: id,
      event_type: 'company_activated',
      metadata: {
        previous_status: status_before_last_save,
        activation_time: Time.current
      }
    )
  rescue StandardError => e
    Rails.logger.error("[Analytics] Failed to enqueue company activation tracking: #{e.message}")
  end

  def verified_badge_validation
    return unless verified_badge.attached?

    allowed = ALLOWED_LOGO_CONTENT_TYPES
    unless allowed.include?(verified_badge.blob.content_type)
      errors.add(:verified_badge, 'deve ser PNG, JPG, SVG ou WEBP')
    end

    return unless verified_badge.blob.byte_size > 2.megabytes

    errors.add(:verified_badge, 'deve ter no mÃƒÂ¡ximo 2MB')
  end

  def ensure_slug
    base = slug.presence || name.to_s
    base = base.parameterize
    base = "company-#{id || SecureRandom.hex(4)}" if base.blank?
    self.slug = generate_unique_slug(base)
  end

  def generate_unique_slug(base)
    candidate = base
    counter = 2
    while self.class.where.not(id: id).exists?(slug: candidate)
      candidate = "#{base}-#{counter}"
      counter += 1
    end
    candidate
  end

  def parse_features(raw_features)
    case raw_features
    when String
      begin
        JSON.parse(raw_features)
      rescue StandardError
        begin
          YAML.safe_load(raw_features)
        rescue StandardError
          {}
        end
      end
    when Hash
      raw_features
    when NilClass
      {}
    else
      raw_features.respond_to?(:to_unsafe_h) ? raw_features.to_unsafe_h : {}
    end
  end

  def raw_plan_features
    return {} unless respond_to?(:plan) && plan.present?

    if plan.respond_to?(:raw_feature_flags)
      plan.raw_feature_flags
    elsif plan.respond_to?(:features_json) && plan.features_json.present?
      plan.features_json
    elsif plan.respond_to?(:features) && plan.features.present?
      plan.features
    else
      {}
    end
  end

  def raw_company_plan_overrides
    return {} unless respond_to?(:plan_features) && plan_features.present?

    parse_features(plan_features)
  end

  def raw_company_feature_overrides
    {}.tap do |overrides|
      overrides['custom_ctas'] = true if respond_to?(:active_admin) && active_admin
      overrides['social_proof'] = true if respond_to?(:social_proof_enabled) && social_proof_enabled
      overrides['financing_simulation'] = true if respond_to?(:financing_tab_visible) && financing_tab_visible
      overrides['media_upload'] = true if featured? || verified?
      overrides['intent_scores'] = true if respond_to?(:intent_pro?) && intent_pro?
      overrides['webhooks'] = true if respond_to?(:intent_enterprise?) && intent_enterprise?
    end
  end

  def raw_effective_plan_features
    raw_plan_features
      .merge(raw_company_plan_overrides)
      .merge(raw_company_feature_overrides)
  end

  def generate_attachment_url(attachment)
    return nil if attachment.blank?

    if attachment.respond_to?(:attached?)
      return nil unless attachment.attached?
    elsif !attachment.is_a?(ActiveStorage::Attachment)
      return nil
    end

    begin
      # Use rails_storage_proxy_url to serve images through the app
      options = Rails.application.routes.default_url_options.dup

      # For development, ensure port is correct if using localhost
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

      Rails.application.routes.url_helpers.rails_storage_proxy_url(attachment, options)
    rescue StandardError => e
      Rails.logger.error("Error generating attachment URL for company #{id}: #{e.message}")
      nil
    end
  end

  def capture_category_ids_for_metrics
    @category_ids_for_metrics_update = categories.pluck(:id)
  end

  def update_associated_categories_metrics
    # Combine old and new category IDs to ensure all affected categories are updated
    all_ids = (@category_ids_for_metrics_update || []) + categories.pluck(:id)
    return if all_ids.empty?

    # Using SQL for efficiency and avoiding N+1
    Category.where(id: all_ids.uniq).each(&:touch)
  end

  def validate_blob_type_and_size(attribute:, blob:, allowed_types:, max_size:, invalid_type_message:,
                                  invalid_size_message:)
    return if blob.blank?

    content_type = blob.content_type.to_s
    errors.add(attribute, invalid_type_message) unless allowed_types.include?(content_type)
    errors.add(attribute, invalid_size_message) if blob.byte_size.to_i > max_size
  rescue StandardError => e
    Rails.logger.warn("[Company] Falha ao validar blob atributo=#{attribute} id=#{id} erro=#{e.class}: #{e.message}")
    errors.add(attribute, 'arquivo invÃƒÂ¡lido ou corrompido')
  end

  def validate_minimum_dimensions(attribute:, blob:, min_width:, min_height:, recommendation:)
    return if blob.blank?
    return if blob.content_type == 'image/svg+xml'

    blob.analyze unless blob.analyzed?
    metadata = blob.metadata || {}
    width = metadata['width']
    height = metadata['height']
    return if width.blank? || height.blank?
    return if width >= min_width && height >= min_height

    errors.add(attribute, "dimensÃƒÂµes muito pequenas (#{width}x#{height}px). MÃƒÂ­nimo recomendado: #{recommendation}")
  rescue StandardError => e
    Rails.logger.warn("[Company] Falha ao validar dimensoes atributo=#{attribute} id=#{id} erro=#{e.class}: #{e.message}")
  end

  def invalidate_companies_cache
    Rails.cache.delete_matched('companies:index:v2:*')
    Rails.cache.delete('companies_featured_v1')
    Rails.logger.info("[Company] Cache invalidated for company_id=#{id}")
  rescue StandardError => e
    Rails.logger.error("[Company] Failed to invalidate cache: #{e.message}")
  end

  # Intent Tier Methods
  validates :intent_tier, inclusion: { in: INTENT_TIERS }

  def intent_pro?
    %w[pro enterprise].include?(intent_tier)
  end

  def intent_enterprise?
    intent_tier == 'enterprise'
  end

  def can_view_intent_scores?
    explicit_flag = explicit_feature_value_from_plan?(:intent_scores, :intent_engine, :intent_score_access)
    return explicit_flag unless explicit_flag.nil?

    return true if intent_pro?

    feature_enabled_from_plan?(:intent_scores, :intent_engine, :intent_score_access, include_defaults: true) == true
  end

  def can_use_webhooks?
    explicit_flag = explicit_feature_value_from_plan?(:webhooks, :webhook, :webhook_access)
    return explicit_flag unless explicit_flag.nil?

    return true if intent_enterprise?

    feature_enabled_from_plan?(:webhooks, :webhook, :webhook_access, include_defaults: true) == true
  end

  def max_intent_history_days
    case intent_tier
    when 'enterprise' then 90
    when 'pro' then 30
    else 7
    end
  end
end
