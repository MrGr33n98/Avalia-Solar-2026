require 'uri'

class Banner < ApplicationRecord
  # Legacy single-category link (kept for backward compatibility)
  belongs_to :category, optional: true

  # New many-to-many categories targeting
  has_and_belongs_to_many :categories, join_table: :banners_categories
  belongs_to :company, optional: true
  belongs_to :approved_by_admin_user, class_name: 'AdminUser', optional: true
  has_one_attached :image

  MODERATION_STATUSES = %w[draft submitted approved rejected].freeze
  ALLOWED_POSITIONS = %w[
    navbar
    sidebar
    categories_top
    home_top
    companies_top
    companies_footer
    article_footer_cta
    search_top
    search_mid
    categories_filter_sidebar
    categories_right_rail
    companies_right_rail
    pricing_advertise_section
    company_profile_about_inline
    company_profile_related_carousel
    company_profile_sidebar_sponsored
    compare_hero
    compare_page_top
    compare_page_inline
    compare_page_sidebar
    compare_page_bottom
    comparison_floating_bar
  ].freeze
  ALLOWED_BANNER_TYPES = %w[rectangular_large rectangular_small].freeze
  DEFAULT_DIMENSIONS_BY_POSITION = {
    'navbar' => [960, 100],
    'sidebar' => [150, 125],
    'companies_footer' => [1200, 160],
    'article_footer_cta' => [1200, 160],
    'search_top' => [1200, 180],
    'search_mid' => [1200, 160],
    'categories_filter_sidebar' => [300, 250],
    'categories_right_rail' => [300, 600],
    'companies_right_rail' => [300, 600],
    'pricing_advertise_section' => [1200, 160],
    'company_profile_about_inline' => [1200, 160],
    'company_profile_related_carousel' => [1200, 160],
    'company_profile_sidebar_sponsored' => [300, 600],
    'compare_hero' => [1200, 300],
    'compare_page_top' => [1200, 160],
    'compare_page_inline' => [1200, 160],
    'compare_page_sidebar' => [300, 600],
    'compare_page_bottom' => [1200, 160],
    'comparison_floating_bar' => [720, 120]
  }.freeze

  # === Validações Básicas ===
  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: ALLOWED_BANNER_TYPES }
  validates :position, inclusion: { in: ALLOWED_POSITIONS }
  validates :image, presence: true
  validates :moderation_status, inclusion: { in: MODERATION_STATUSES },
                                if: -> { self.class.column_names.include?('moderation_status') }

  # === Validações de Dimensões (Fase 1) ===
  # Garante que width e height sejam obrigatórias e válidas
  validates :width, presence: true,
                    numericality: { only_integer: true, greater_than: 0 }
  validates :height, presence: true,
                     numericality: { only_integer: true, greater_than: 0 }

  # === Validação de Prioridade (Fase 1) ===
  # Priority deve estar entre 1 e 1000, ou nil (usa default 100)
  validates :priority, numericality: {
    only_integer: true,
    greater_than: 0,
    less_than_or_equal_to: 1000
  }, allow_nil: true

  # === Validações de Datas (Fase 1 - CRÍTICO) ===
  # Garante que end_date seja posterior a start_date
  validate :end_date_must_be_after_start_date,
           if: -> { start_date.present? && end_date.present? }

  # === Validação de Limite por Empresa (Fase 1) ===
  # Garante que empresa respeita limite de banners ativos conforme sua assinatura
  validate :respect_company_active_banners_limit,
           on: :create,
           if: -> { company_id.present? && active == true }

  # === Callbacks ===
  before_validation :ensure_dimensions
  before_validation :normalize_locations
  before_save :sync_legacy_category_id
  after_save :invalidate_cache
  after_destroy :invalidate_cache

  def self.banner_variants_enabled?
    flag = ENV.fetch('BANNER_VARIANTS_ENABLED', nil)
    return false if flag&.casecmp('false')&.zero?

    variants_supported?
  end

  def self.variants_supported?
    return @variants_supported unless @variants_supported.nil?

    @variants_supported =
      case Rails.application.config.active_storage.variant_processor
      when :vips
        begin
          require 'vips'
          true
        rescue LoadError, StandardError => e
          Rails.logger.warn("[Banner] Disabling variants (vips unavailable): #{e.message}")
          false
        end
      when :mini_magick
        begin
          require 'mini_magick'
          !!MiniMagick::Utilities.which('magick')
        rescue LoadError, StandardError => e
          Rails.logger.warn("[Banner] Disabling variants (mini_magick unavailable): #{e.message}")
          false
        end
      else
        false
      end
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[alt_text category_id company_id created_at id image_url title updated_at link active sponsored width height
       banner_type position start_date end_date moderation_status priority slot_key approved_by_admin_user_id approved_at target_states target_cities]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category categories company approved_by_admin_user image_attachment image_blob]
  end

  scope :approved, -> { where(moderation_status: 'approved') }

  def self.default_dimensions_for_position(position)
    DEFAULT_DIMENSIONS_BY_POSITION.fetch(position.to_s, [600, 200])
  end

  def submit_for_review!
    update!(moderation_status: 'submitted', active: false)
  end

  def approve!(admin_user)
    update!(
      moderation_status: 'approved',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      rejected_reason: nil
    )
  end

  def reject!(admin_user, reason)
    update!(
      moderation_status: 'rejected',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      active: false,
      rejected_reason: reason
    )
  end

  def link_url
    link
  end

  scope :currently_active, lambda {
    scope = where(active: true)
    scope = scope.where(moderation_status: 'approved') if column_names.include?('moderation_status')
    scope = scope.where('start_date IS NULL OR start_date <= ?', Time.current) if column_names.include?('start_date')
    scope = scope.where('end_date IS NULL OR end_date >= ?', Time.current) if column_names.include?('end_date')
    scope
  }

  def image_url
    return nil unless image.attached?

    source = image
    if self.class.banner_variants_enabled? && width.present? && height.present?
      source = image.variant(resize_to_limit: [width, height])
    end

    Rails.application.routes.url_helpers.rails_storage_proxy_url(source, safe_url_options)
       banner_type position start_date end_date moderation_status priority slot_key approved_by_admin_user_id approved_at target_states target_cities]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category categories company approved_by_admin_user image_attachment image_blob]
  end

  scope :approved, -> { where(moderation_status: 'approved') }

  def self.default_dimensions_for_position(position)
    DEFAULT_DIMENSIONS_BY_POSITION.fetch(position.to_s, [600, 200])
  end

  def submit_for_review!
    update!(moderation_status: 'submitted', active: false)
  end

  def approve!(admin_user)
    update!(
      moderation_status: 'approved',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      rejected_reason: nil
    )
  end

  def reject!(admin_user, reason)
    update!(
      moderation_status: 'rejected',
      approved_by_admin_user: admin_user,
      approved_at: Time.current,
      active: false,
      rejected_reason: reason
    )
  end

  def link_url
    link
  end

  scope :currently_active, lambda {
    scope = where(active: true)
    scope = scope.where(moderation_status: 'approved') if column_names.include?('moderation_status')
    scope = scope.where('start_date IS NULL OR start_date <= ?', Time.current) if column_names.include?('start_date')
    scope = scope.where('end_date IS NULL OR end_date >= ?', Time.current) if column_names.include?('end_date')
    scope
  }

  def image_url
    return nil unless image.attached?

    source = image
    if self.class.banner_variants_enabled? && width.present? && height.present?
      source = image.variant(resize_to_limit: [width, height])
    end

    Rails.application.routes.url_helpers.rails_storage_proxy_url(source, safe_url_options)
  rescue StandardError => e
    Rails.logger.error("Error generating banner image URL: #{e.message}")
    begin
      Rails.application.routes.url_helpers.rails_storage_proxy_url(image, safe_url_options)
    rescue StandardError
      nil
    end
  end

  def as_json(options = {})
    super.merge(image_url: image_url)
  end

  private

  def ensure_dimensions
    return unless self.class.column_names.include?('width') && self.class.column_names.include?('height')
    return if width.present? && height.present?

    self.width, self.height = default_dimensions_for_position(position)
  end

  def target_states=(val)
    return unless self.class.column_names.include?('target_states')

    raw_list = if val.is_a?(String)
                 val.split(',')
               elsif val.is_a?(Array)
                 val.flat_map { |v| v.to_s.split(',') }
               else
                 Array(val)
               end
    super(raw_list.map(&:to_s).map(&:strip).map(&:upcase).reject(&:blank?).uniq)
  end

  def target_cities=(val)
    return unless self.class.column_names.include?('target_cities')

    raw_list = if val.is_a?(String)
                 val.split(',')
               elsif val.is_a?(Array)
                 val.flat_map { |v| v.to_s.split(',') }
               else
                 Array(val)
               end
    super(raw_list.map(&:to_s).map(&:strip).reject(&:blank?).uniq)
  end

  def normalize_locations
    return unless self.class.column_names.include?('target_states') || self.class.column_names.include?('target_cities')

    self.target_states = Array(target_states) if respond_to?(:target_states=)
    self.target_cities = Array(target_cities) if respond_to?(:target_cities=)
  end

  def default_dimensions_for_position(pos)
    self.class.default_dimensions_for_position(pos)
  end

  def sync_legacy_category_id
    return unless self.class.column_names.include?('category_id')

    ids = category_ids
    self.category_id = ids.first
  end

  def end_date_must_be_after_start_date
    return unless end_date < start_date

    errors.add(:end_date, 'deve ser posterior à data de início')
  end

  def respect_company_active_banners_limit
    return unless company

    active_subscription = company.banner_subscriptions
                                 .where(status: 'active')
                                 .where('starts_at <= ?', Time.current)
                                 .where('ends_at IS NULL OR ends_at >= ?', Time.current)
                                 .first

    return unless active_subscription&.banner_offer

    offer = active_subscription.banner_offer
    max_total = offer.rules['max_total_active']&.to_i
    max_per_position = offer.rules['max_active_per_position']&.to_i

    if max_total.present?
      current_active_count = company.banners
                                    .where(active: true)
                                    .where.not(id: id)
                                    .count

      if current_active_count >= max_total
        errors.add(:base, "Limite de #{max_total} banners ativos atingido. Upgrade seu plano.")
        return
      end
    end

    return unless max_per_position.present? && position.present?

    current_position_count = company.banners
                                    .where(active: true, position: position)
                                    .where.not(id: id)
                                    .count

    return unless current_position_count >= max_per_position

    errors.add(:position, "Limite de #{max_per_position} banners ativos na posição '#{position}' atingido.")
  end

  def invalidate_cache
    Rails.cache.delete_matched('banners/v1/*')
    Rails.logger.info("[Banner##{id}] Cache invalidado após alteração")
  rescue StandardError => e
    Rails.logger.error("[Banner##{id}] Erro ao invalidar cache: #{e.message}")
  end

  def safe_url_options
    opts = Rails.application.routes.default_url_options || {}
    return opts.slice(:host, :protocol, :port) if opts[:host].present?

    app_host = ENV.fetch('APP_HOST', 'http://localhost:3001')
    uri = URI(app_host)
    {
      host: uri.host || app_host,
      protocol: uri.scheme || 'http',
      port: uri.port && ![80, 443].include?(uri.port) ? uri.port : nil
    }.compact
  rescue StandardError
    { host: 'localhost', protocol: 'http' }
  end
end
