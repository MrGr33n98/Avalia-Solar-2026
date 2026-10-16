require 'uri'

class Banner < ApplicationRecord
  # Legacy single-category link (kept for backward compatibility)
  belongs_to :category, optional: true

  # New many-to-many categories targeting
  has_and_belongs_to_many :categories, join_table: :banners_categories
  belongs_to :company, optional: true
  belongs_to :financial_institution, optional: true
  belongs_to :financing_option, optional: true
  belongs_to :approved_by_admin_user, class_name: 'AdminUser', optional: true
  has_one_attached :image
  has_one_attached :image_mobile

  has_many :banner_addon_subscriptions, dependent: :destroy
  has_many :active_banner_addon_subscriptions, -> { active }, class_name: 'BannerAddonSubscription'
  has_many :banner_audit_logs, as: :auditable, dependent: :destroy

  MODERATION_STATUSES = %w[draft submitted approved rejected].freeze
  ALLOWED_POSITIONS = BannerPlacements::Catalog.keys.freeze
  ALLOWED_BANNER_TYPES = %w[rectangular_large rectangular_small].freeze
  ALLOWED_THEMES = %w[dark light].freeze
  ALLOWED_CTA_VARIANTS = %w[solar_yellow primary_blue outline custom].freeze
  ALLOWED_OVERLAY_VARIANTS = %w[none left_soft left_strong].freeze
  ALLOWED_CREATIVE_MODES = %w[photo_with_html image_only].freeze
  HEX_COLOR_REGEX = /\A#[0-9A-Fa-f]{6}\z/

  # === Validações Básicas ===
  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: ALLOWED_BANNER_TYPES }
  validates :position, inclusion: { in: ALLOWED_POSITIONS }
  validates :image, presence: true, unless: -> { image.attached? }

  # === Validações Hero / Campanhas (Fase 1) ===
  validates :headline, length: { maximum: 110 }, allow_blank: true
  validates :subtitle, length: { maximum: 180 }, allow_blank: true
  validates :cta_label, length: { maximum: 36 }, allow_blank: true
  validates :theme, inclusion: { in: ALLOWED_THEMES }, allow_blank: true
  validates :cta_variant, inclusion: { in: ALLOWED_CTA_VARIANTS }, allow_blank: true
  validates :overlay_variant, inclusion: { in: ALLOWED_OVERLAY_VARIANTS }, allow_blank: true
  validates :creative_mode, inclusion: { in: ALLOWED_CREATIVE_MODES }, allow_blank: true
  validates :hero_background_color, format: { with: HEX_COLOR_REGEX, message: 'deve ser um código hexadecimal válido (#RRGGBB)' }, allow_blank: true
  validates :hero_text_color, format: { with: HEX_COLOR_REGEX, message: 'deve ser um código hexadecimal válido (#RRGGBB)' }, allow_blank: true
  validates :cta_background_color, format: { with: HEX_COLOR_REGEX, message: 'deve ser um código hexadecimal válido (#RRGGBB)' }, allow_blank: true
  validates :cta_text_color, format: { with: HEX_COLOR_REGEX, message: 'deve ser um código hexadecimal válido (#RRGGBB)' }, allow_blank: true
  validates :object_position_desktop_x, :object_position_desktop_y,
            :object_position_mobile_x, :object_position_mobile_y,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 },
            allow_nil: true

  def category_ids=(val)
    clean_ids = Array(val).flatten.compact.map(&:to_s).reject(&:blank?).map(&:to_i).uniq
    super(clean_ids)
  end
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

  # === Validação de URL de Destino (Fase 4) ===
  validate :validate_link_url, if: -> { link.present? }
  validate :validate_cta_href, if: -> { cta_href.present? }
  validate :validate_image_attachments

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
    %w[alt_text category_id company_id financial_institution_id financing_option_id created_at id image_url title updated_at link active sponsored width height
       banner_type position start_date end_date moderation_status priority slot_key approved_by_admin_user_id approved_at target_states target_cities
       headline subtitle cta_label cta_href cta_enabled theme cta_variant hero_background_color hero_text_color cta_background_color cta_text_color
       overlay_variant creative_mode whole_banner_clickable creative_version]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category categories company approved_by_admin_user image_attachment image_blob image_mobile_attachment image_mobile_blob]
  end

  scope :approved, -> { where(moderation_status: 'approved') }

  def self.default_dimensions_for_position(position)
    BannerPlacements::Catalog.fetch(position).dimensions
  rescue KeyError
    [600, 200]
  end

  def submit_for_review!
    attrs = { moderation_status: 'submitted', active: false }
    attrs[:rejected_reason] = nil if self.class.column_names.include?('rejected_reason')
    update!(attrs)
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
    if self.class.banner_variants_enabled?
      variant_limit = if position == 'home_hero'
                        [1920, 600]
                      elsif width.present? && height.present?
                        [width, height]
                      end
      source = image.variant(resize_to_limit: variant_limit) if variant_limit
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

  def image_mobile_url
    return nil unless image_mobile.attached?

    source = image_mobile
    if self.class.banner_variants_enabled?
      source = image_mobile.variant(resize_to_limit: [780, 460])
    end

    Rails.application.routes.url_helpers.rails_storage_proxy_url(source, safe_url_options)
  rescue StandardError => e
    Rails.logger.error("Error generating banner mobile image URL: #{e.message}")
    begin
      Rails.application.routes.url_helpers.rails_storage_proxy_url(image_mobile, safe_url_options)
    rescue StandardError
      nil
    end
  end

  def as_json(options = {})
    super.merge(
      image_url: image_url,
      image_mobile_url: image_mobile_url
    )
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

  def operational_status
    return "Rascunho" if moderation_status == "draft"
    return "Em Revisão" if moderation_status == "submitted"
    return "Rejeitado" if moderation_status == "rejected"
    return "Expirado" if end_date.present? && end_date < Time.current
    return "Agendado" if start_date.present? && start_date > Time.current
    return "Pausado" unless active
    moderation_status == "approved" ? "Veiculando" : moderation_status.to_s.humanize
  end

  private

  def ensure_dimensions
    return unless self.class.column_names.include?('width') && self.class.column_names.include?('height')
    # Aplica default somente quando o criativo nao informou nenhuma dimensao.
    # Campo explicitamente nulo deve falhar na validacao, nao ser mascarado.
    return unless width.nil? && height.nil?

    self.width, self.height = default_dimensions_for_position(position)
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

  def validate_link_url
    uri = URI.parse(link)
    unless uri.scheme.in?(%w[http https])
      errors.add(:link, 'deve ser um link HTTP ou HTTPS válido')
      return
    end

    if uri.host.blank? || uri.host.include?('localhost') || uri.host.match?(/\A(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)
      errors.add(:link, 'não pode apontar para endereços locais ou privados')
      return
    end

    if link.downcase.include?('javascript:') || link.downcase.include?('data:')
      errors.add(:link, 'formato de link inválido')
    end
  rescue URI::InvalidURIError
    errors.add(:link, 'não é uma URL válida')
  end

  def validate_cta_href
    return if cta_href.blank?

    if cta_href.start_with?('/')
      if cta_href.match?(%r{\A//[^/]}) || cta_href.downcase.include?('javascript:') || cta_href.downcase.include?('data:')
        errors.add(:cta_href, 'formato de link relativo inválido')
      end
      return
    end

    uri = URI.parse(cta_href)
    unless uri.scheme.in?(%w[http https])
      errors.add(:cta_href, 'deve ser um link HTTP ou HTTPS válido ou um caminho relativo (/...)')
      return
    end

    if uri.host.blank? || uri.host.include?('localhost') || uri.host.match?(/\A(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)
      errors.add(:cta_href, 'não pode apontar para endereços locais ou privados')
      return
    end

    if cta_href.downcase.include?('javascript:') || cta_href.downcase.include?('data:')
      errors.add(:cta_href, 'formato de link inválido')
    end
  rescue URI::InvalidURIError
    errors.add(:cta_href, 'não é uma URL válida')
  end

  ALLOWED_IMAGE_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
  MAX_IMAGE_SIZE = 10.megabytes

  def validate_image_attachments
    [image, image_mobile].each do |attachment|
      next unless attachment.attached?

      blob = attachment.blob
      next unless blob

      errors.add(:base, 'A imagem deve ter no máximo 10 MB') if blob.byte_size.to_i > MAX_IMAGE_SIZE

      unless ALLOWED_IMAGE_TYPES.include?(blob.content_type.to_s)
        errors.add(:base, 'A imagem deve estar no formato PNG, JPEG ou WebP')
      end
    end
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
    Banners::CacheInvalidatorService.call(self)
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
