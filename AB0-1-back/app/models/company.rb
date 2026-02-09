require 'securerandom'

class Company < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching
  include Moderation
  has_paper_trail # Enable rollback capabilities

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
  has_many :banner_subscriptions, dependent: :destroy
  has_many :company_videos, dependent: :destroy
  has_and_belongs_to_many :articles
  belongs_to :plan, optional: true
  has_many :company_members, dependent: :destroy
  has_many :company_access_requests, dependent: :destroy
  accepts_nested_attributes_for :company_members, allow_destroy: true
  has_many :members, through: :company_members, source: :user

  # =========================
  # Callbacks
  # =========================
  attr_accessor :category_ids_for_metrics_update

  before_save :capture_category_ids_for_metrics, prepend: true
  after_save :update_associated_categories_metrics
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
  validate :validate_verified_requires_cnpj
  validate :validate_category_ids_format
  validate :validate_attachments
  
  validates :website,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'must be a valid URL' },
            allow_blank: true
  validates :phone,
            format: { with: /\A\d{10,15}\z/,
                      message: 'must contain only digits (DDD + número)' },
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
                      
  validate :validate_corporate_email, if: -> { status == 'active' }

  validates :whatsapp_url,
            presence: true,
            format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
                      message: 'deve ser uma URL válida (ex: https://wa.me/)' },
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
    
    if minimum_ticket > maximum_ticket
      errors.add(:minimum_ticket, 'deve ser menor ou igual ao ticket máximo')
    end
  end

  # Scopes
  scope :active, -> { where(status: 'active') }
  scope :featured, -> { where(featured: true) }
  scope :verified, -> { where(verified: true) }
  scope :by_state, ->(state) { where(state: state) if state.present? }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :ordered, -> { order(featured: :desc, rating_avg: :desc, name: :asc) }

  def self.ransackable_attributes(auth_object = nil)
    ["name", "description", "status", "state", "city", "featured", "verified", "cnpj", "founded_year", "employees_count", "rating_avg", "created_at", "updated_at", "plan_id", "moderation_status", "active_admin"]
  end

  def self.ransackable_associations(auth_object = nil)
    [
      "categories", "products", "reviews", "leads", "campaigns",
      "company_buttons", "financing_options", "company_faqs",
      "company_financing_profile", "company_financing_partners",
      "company_financing_offers", "banners", "banner_subscriptions",
      "company_videos", "plan", "company_members", "members"
    ]
  end

  def average_rating
    rating_avg
  end

  def rating_count
    self[:rating_count] || 0
  end

  def recalculate_rating_cache!
    new_rating = reviews.approved.average(:rating).to_f.round(2)
    new_count = reviews.approved.count
    
    update_columns(rating_avg: new_rating, rating_count: new_count)
    
    # Update associated categories metrics
    categories.each(&:update_metrics!)
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
    if name.blank? || name.length < 2
      errors.add(:name, 'é obrigatório para ativação (mínimo 2 caracteres)')
    end

    if email.blank? || !SIMPLE_EMAIL_REGEX.match?(email)
      errors.add(:email, 'inválido ou ausente para ativação')
    end

    unless Locations::BrLocations.valid_state?(state)
      errors.add(:state, 'inválido ou ausente para ativação')
    end

    unless Locations::BrLocations.valid_city?(state, city)
      errors.add(:city, 'inválida ou ausente para ativação')
    end

    unless categories.any?
      errors.add(:categories, 'pelo menos uma categoria é necessária para ativação')
    end

    unless phone.present? || whatsapp.present? || email_public.present?
      errors.add(:base, 'Pelo menos um contato (Telefone, WhatsApp ou Email Público) é necessário para ativação')
    end
  end

  def validate_featured_requires_active
    return unless featured
    return if status == 'active'

    errors.add(:featured, 'só pode ser verdadeiro quando o status é active')
  end

  def validate_verified_requires_cnpj
    return unless verified

    digits = cnpj.to_s.gsub(/\D/, '')
    if digits.length < 14 || (defined?(CNPJ) && !CNPJ.valid?(cnpj))
      errors.add(:verified, 'exige um CNPJ válido')
    end
  end

  # FIX #6: Adicionar validação robusta de category_ids format em Company
  def validate_category_ids_format
    # We use raw category_ids if available, or just check the association
    # Active Record's category_ids usually returns an array.
    # But when receiving from API, it might be anything.

    # If it's nil, it's fine (might be handled by presence validation elsewhere)
    return if category_ids.nil?

    unless category_ids.is_a?(Array)
      errors.add(:category_ids, 'formato inválido: deve ser um array')
      return
    end

    if category_ids.any? { |id| id.to_s.present? && !id.to_s.match?(/\A\d+\z/) }
      errors.add(:category_ids, 'contém identificadores inválidos')
    end
  end

  def validate_corporate_email
    return if email.blank?
    
    # Se a empresa não tem website, não validamos domínio corporativo
    return if website.blank?

    domain = begin
      URI.parse(website).host&.sub(/\Awww\./, '')
    rescue
      nil
    end
    
    return if domain.blank?

    # Permite emails que contenham o domínio ou subdomínios
    unless email.downcase.include?(domain.downcase)
      errors.add(:email, "deve ser um e-mail corporativo (domínio #{domain})")
    end
  end

  def normalize_company_fields
    self.state = state.to_s.strip.upcase if state.present?
    self.city = city.to_s.strip.gsub(/\s+/, ' ') if city.present?
    self.email = email.to_s.strip.downcase if email.present?
    self.email_public = email_public.to_s.strip.downcase if email_public.present?
    self.phone = normalize_phone_value(phone)
    self.phone_alt = normalize_phone_value(phone_alt)
    self.whatsapp = normalize_phone_value(whatsapp)

    if whatsapp.present? && whatsapp_url.blank?
      digits = whatsapp.to_s
      digits = digits.sub(/\A55/, '') if digits.length > 11
      self.whatsapp_url = "https://wa.me/55#{digits}"
    end
  end

  def normalize_phone_value(value)
    digits = value.to_s.gsub(/\D/, '')
    digits.presence
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

  def validate_attachments
    # Só valida se houver novos uploads anexados
    validate_logo_attachment if logo.attached? && logo.attachment.present?
    validate_banner_attachment if banner.attached? && banner.attachment.present?
    validate_media_assets_attachments if media_assets.attached?
  rescue => e
    Rails.logger.error "Erro na validação de attachments: #{e.message}"
    # Não bloqueia salvamento se houver erro nas validações de arquivo
  end

  def validate_media_assets_attachments
    media_assets.each do |asset|
      next unless asset.attachment.present? # Só valida novos uploads

      begin
        content_type = asset.blob.content_type
        if !content_type.start_with?('image/')
          errors.add(:media_assets, "arquivo #{asset.filename} deve ser uma imagem")
        end

        if asset.blob.byte_size > 15.megabytes
          errors.add(:media_assets, "arquivo #{asset.filename} excede o limite de 15MB")
        end
      rescue => e
        Rails.logger.error "Erro ao validar asset: #{e.message}"
      end
    end
  end

  def validate_logo_attachment
    return unless logo.attached?
    
    begin
      content_type = logo.blob.content_type
      if !content_type.in?(%w[image/png image/jpeg image/jpg image/svg+xml image/webp])
        errors.add(:logo, 'deve ser PNG, JPG, SVG ou WebP')
      end
      
      if logo.blob.byte_size > 5.megabytes
        errors.add(:logo, 'tamanho máximo é 5MB')
      end

      # Validação de dimensões (opcional, apenas se não for SVG)
      if content_type != 'image/svg+xml'
        logo.blob.analyze unless logo.blob.analyzed?
        meta = logo.blob.metadata || {}
        w = meta['width']
        h = meta['height']
        if w && h && (w < 100 || h < 100)
          errors.add(:logo, "dimensões muito pequenas (#{w}x#{h}px). Mínimo recomendado: 200x200px")
        end
      end
    rescue => e
      Rails.logger.error "Erro ao validar logo: #{e.message}"
    end
  end

  def validate_banner_attachment
    return unless banner.attached?
    
    begin
      content_type = banner.blob.content_type
      if !content_type.in?(%w[image/png image/jpeg image/jpg image/webp])
        errors.add(:banner, 'deve ser PNG, JPG ou WebP')
      end
      
      if banner.blob.byte_size > 10.megabytes
        errors.add(:banner, 'tamanho máximo é 10MB')
      end
      
      # Análise de dimensões
      banner.blob.analyze unless banner.blob.analyzed?
      meta = banner.blob.metadata || {}
      w = meta['width']
      h = meta['height']
      if w && h && (w < 800 || h < 200)
        errors.add(:banner, "dimensões muito pequenas (#{w}x#{h}px). Mínimo recomendado: 1200x400px")
      end
    rescue => e
      Rails.logger.warn "Falha ao analisar banner: #{e.message}"
    end
  end
  
  # Constantes (mantidas no modelo)
  PROJECT_TYPES = %w[Residenciais Comerciais Rurais].freeze
  SERVICES_OFFERED = [
    'Instalação Residencial',
    'Instalação Comercial',
    'Instalação Industrial',
    'Manutenção e Suporte',
    'Consultoria Energética'
  ].freeze

  before_validation :normalize_company_fields
  before_validation :normalize_multiselects
  before_validation :ensure_slug
  validate :validate_project_types, :validate_services_offered

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

  def validate_cnpj_format
    return if cnpj.blank?
    unless CNPJ.valid?(cnpj)
      errors.add(:cnpj, 'inválido')
    end
  end

  def validate_state_in_dataset
    return if state.blank?
    return if Locations::BrLocations.valid_state?(state)

    errors.add(:state, 'inválido')
  end

  def validate_city_in_dataset
    return if city.blank?

    if state.blank?
      errors.add(:city, 'requer um estado válido')
      return
    end

    return if Locations::BrLocations.valid_city?(state, city)

    errors.add(:city, 'inválida para o estado selecionado')
  end

  def has_paid_plan?
    return false unless respond_to?(:plan_status) && respond_to?(:plan)
    plan_status == 'active' && plan.present? && plan.price.to_f > 0
  end

  # Business rule: quote/whatsapp CTAs are paid features and require active_admin.
  def quote_feature_enabled?
    respond_to?(:active_admin) ? !!active_admin : false
  end

  def financing_feature_allowed?
    flag = feature_enabled_from_plan?(:financing_simulation)
    flag.nil? ? has_paid_plan? : flag
  rescue StandardError
    has_paid_plan?
  end

  def media_upload_allowed?
    flag = feature_enabled_from_plan?(:media_upload, :media_gallery, :allow_media_uploads, :gallery_uploads, :media)
    flag.nil? ? (featured? || verified? || has_paid_plan?) : flag
  rescue StandardError
    featured? || verified? || has_paid_plan?
  end

  # Expose without question mark for serializers expecting an attribute-style method
  def media_upload_allowed
    media_upload_allowed?
  end

  def resolved_plan_features
    return @resolved_plan_features if defined?(@resolved_plan_features)

    raw_features =
      if respond_to?(:effective_plan_features) && effective_plan_features.present?
        effective_plan_features
      elsif respond_to?(:plan_features) && plan_features.present?
        plan_features
      elsif plan&.respond_to?(:features) && plan.features.present?
        plan.features
      else
        {}
      end

    @resolved_plan_features = parse_features(raw_features)
  rescue StandardError
    @resolved_plan_features = {}
  end

  def feature_enabled_from_plan?(*keys)
    features = resolved_plan_features
    keys.flatten.each do |key|
      value = features[key.to_s] || features[key.to_sym]
      return ActiveModel::Type::Boolean.new.cast(value) unless value.nil?
    end
    nil
  end

  def financing_tab_visible?
    financing_enabled && financing_feature_allowed?
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

  after_update :track_activation_event, if: :saved_change_to_status?
  after_update :track_plan_change_event, if: :saved_change_to_plan_id?

  private

  def track_plan_change_event
    Analytics::TrackEventService.call(
      company_id: id,
      event_type: 'plan_changed',
      metadata: {
        previous_plan_id: plan_id_before_last_save,
        new_plan_id: plan_id,
        status: plan_status
      }
    )
  rescue => e
    Rails.logger.error("[Analytics] Failed to track plan change: #{e.message}")
  end

  def track_activation_event
    return unless status == 'active' && status_before_last_save != 'active'

    Analytics::TrackEventService.call(
      company_id: id,
      event_type: 'company_activated',
      metadata: {
        previous_status: status_before_last_save,
        activation_time: Time.current
      }
    )
  rescue => e
    Rails.logger.error("[Analytics] Failed to track company activation: #{e.message}")
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
      JSON.parse(raw_features) rescue (YAML.safe_load(raw_features) rescue {})
    when Hash
      raw_features
    else
      {}
    end
  end

  def generate_attachment_url(attachment)
    return nil unless attachment&.attached?

    begin
      # Use rails_storage_proxy_url to serve images through the app
      options = Rails.application.routes.default_url_options.dup
      
      # For development, ensure port is correct if using localhost
      if Rails.env.development? && options[:host] == 'localhost'
        options[:port] = 3001
      end

      Rails.application.routes.url_helpers.rails_storage_proxy_url(attachment, options)
    rescue => e
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
    Category.where(id: all_ids.uniq).each do |category|
      # Enqueue the job for background processing
      # CategoryMetricsUpdateJob.perform_later(category.id)
      
      # For now, we'll just update the timestamp to trigger cache invalidation
      # A separate scheduled job should handle heavy calculations
      category.touch
    end
  end
end
