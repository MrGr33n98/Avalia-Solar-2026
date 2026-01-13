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

  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: %w[rectangular_large rectangular_small] }
  validates :position, inclusion: { in: %w[navbar sidebar categories_top home_top companies_top] }
  validates :image, presence: true
  validates :moderation_status, inclusion: { in: MODERATION_STATUSES }, if: -> { self.class.column_names.include?('moderation_status') }
  validates :width, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :height, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  before_validation :ensure_dimensions
  before_save :sync_legacy_category_id

  def self.banner_variants_enabled?
    flag = ENV['BANNER_VARIANTS_ENABLED']
    return true if flag&.casecmp('true')&.zero?
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
    %w[category_id company_id created_at id image_url title updated_at link active sponsored width height
       banner_type position start_date end_date moderation_status priority slot_key approved_by_admin_user_id approved_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category categories company approved_by_admin_user image_attachment image_blob]
  end

  scope :approved, -> { where(moderation_status: 'approved') }

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
    if column_names.include?('moderation_status')
      scope = scope.where(moderation_status: 'approved')
    end
    if column_names.include?('start_date')
      scope = scope.where('start_date IS NULL OR start_date <= ?', Time.current)
    end
    if column_names.include?('end_date')
      scope = scope.where('end_date IS NULL OR end_date >= ?', Time.current)
    end
    scope
  }

  def image_url
    return nil unless image.attached?

    source = image
    if self.class.banner_variants_enabled? && width.present? && height.present?
      source = image.variant(resize_to_limit: [width, height])
    end

    Rails.application.routes.url_helpers.rails_blob_url(source, **safe_url_options, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating banner image URL: #{e.message}")
    nil
  end

  def as_json(options = {})
    super(options).merge(image_url: image_url)
  end

  private

  def ensure_dimensions
    return unless self.class.column_names.include?('width') && self.class.column_names.include?('height')
    return if width.present? && height.present?

    self.width, self.height = default_dimensions_for_position(position)
  end

  def default_dimensions_for_position(pos)
    case pos.to_s
    when 'navbar'
      [960, 100]
    when 'sidebar'
      [150, 125]
    else
      [600, 200]
    end
  end

  def sync_legacy_category_id
    return unless self.class.column_names.include?('category_id')

    ids = category_ids
    self.category_id = ids.first
  end

  def safe_url_options
    opts = Rails.application.routes.default_url_options || {}
    return opts.slice(:host, :protocol, :port) if opts[:host].present?

    app_host = ENV.fetch('APP_HOST', 'http://localhost:3001')
    uri = URI(app_host)
    {
      host: uri.host || app_host,
      protocol: uri.scheme || 'http',
      port: uri.port && ![80, 443].include?(uri.port) ? uri.port : nil,
    }.compact
  rescue StandardError
    { host: 'localhost', protocol: 'http' }
  end
end
