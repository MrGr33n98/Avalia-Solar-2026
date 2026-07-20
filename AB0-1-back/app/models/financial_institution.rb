class FinancialInstitution < ApplicationRecord
  has_one_attached :logo

  has_many :financing_options, dependent: :destroy
  accepts_nested_attributes_for :financing_options, allow_destroy: true
  
  has_many :banners, dependent: :nullify

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true
  validates :display_order, numericality: { only_integer: true }
  
  validate :logo_format

  scope :active_only, -> { where(active: true) }
  scope :ordered, -> { order(featured: :desc, display_order: :asc, name: :asc) }

  before_validation :generate_slug, on: :create

  def logo_url
    return nil unless logo.attached?

    Rails.application.routes.url_helpers.rails_storage_proxy_url(logo, safe_url_options)
  rescue StandardError => e
    Rails.logger.error("Error generating FinancialInstitution logo URL: #{e.message}")
    nil
  end

  def as_json(options = {})
    super(options).merge(logo_url: logo_url)
  end

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    column_names
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[logo_attachment logo_blob financing_options banners]
  end

  private

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

  def generate_slug
    self.slug = name.parameterize if slug.blank? && name.present?
  end

  def logo_format
    return unless logo.attached?

    unless logo.content_type.in?(%w[image/png image/webp image/svg+xml])
      errors.add(:logo, 'deve ser PNG, WebP ou SVG')
    end
  end
end
