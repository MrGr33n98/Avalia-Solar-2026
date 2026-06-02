class Category < ApplicationRecord
  include SeoStandardizable
  include QueryCacheable # TASK-016: Query Caching

  # permissions_config is a native JSON column, no need to serialize manually in Rails 7+
  # serialize :permissions_config, Hash

  enum kind: { main: 'main', sub: 'sub' }
  enum status: { active: 'active', inactive: 'inactive' }

  # =========================
  # Relations
  # =========================
  belongs_to :parent, class_name: 'Category', optional: true, inverse_of: :children
  has_many :children, class_name: 'Category', foreign_key: 'parent_id', dependent: :destroy, inverse_of: :parent
  has_many :companies_categories, dependent: :destroy
  has_many :companies, through: :companies_categories
  has_many :category_products, dependent: :destroy
  has_many :products, through: :category_products
  has_many :articles, dependent: :nullify
  has_one_attached :banner
  has_one_attached :icon
  has_one_attached :home_carousel_banner
  has_and_belongs_to_many :banners, join_table: :banners_categories
  has_many :lead_wizard_versions, dependent: :destroy, inverse_of: :category
  has_one :category_lead_wizard, dependent: :destroy, inverse_of: :category

  def latest_published_lead_wizard_version
    lead_wizard_versions.published.latest_first.first
  end

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validate :validate_parent_constraints
  validate :validate_banner_technical_requirements
  validate :validate_home_carousel_banner_technical_requirements

  # =========================
  # Scopes
  # =========================
  scope :main_categories, -> { where(kind: 'main') }
  scope :sub_categories, -> { where(kind: 'sub') }
  scope :featured, -> { where(featured: true) }
  scope :active, -> { where(status: 'active') }
  scope :ordered, -> { order(name: :asc) }

  # =========================
  # Callbacks
  # =========================
  after_save :clear_query_cache!

  # =========================
  # Methods
  # =========================
  def clear_query_cache!
    Rails.cache.delete_matched("categories/*")
    Rails.cache.delete("categories/tree")
    true
  end

  def slug
    seo_url
  end

  def icon_url
    return nil unless icon.attached?

    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(icon, options)
    rescue StandardError => e
      Rails.logger.error("Error generating category icon URL: #{e.message}")
      nil
    end
  end

  def home_carousel_banner_url
    return nil unless home_carousel_banner.attached?

    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(home_carousel_banner, options)
    rescue StandardError => e
      Rails.logger.error("Error generating category home carousel banner URL: #{e.message}")
      nil
    end
  end

  def total_reviews_count
    companies.joins(:reviews).count
  end

  private

  def validate_parent_constraints
    return if parent_id.nil?

    if parent_id == id
      errors.add(:parent_id, 'não pode ser a própria categoria')
    elsif parent.present? && parent.sub?
      errors.add(:parent_id, 'deve ser uma categoria principal (main)')
    end
  end

  def update_metrics_on_change(_record)
    update_metrics!
  end

  def validate_banner_technical_requirements
    return unless banner.attached?

    blob = if attachment_changes['banner']
             attachment_changes['banner'].attachment.blob
           else
             banner.blob
           end

    return unless blob

    errors.add(:banner, 'deve ser PNG ou JPG') unless blob.content_type.in?(%w[image/png image/jpeg image/jpg])

    return unless blob.byte_size > 500.kilobytes

    errors.add(:banner, 'deve ter no máximo 500KB')
  end

  def validate_home_carousel_banner_technical_requirements
    return unless home_carousel_banner.attached?

    blob = if attachment_changes['home_carousel_banner']
             attachment_changes['home_carousel_banner'].attachment.blob
           else
             home_carousel_banner.blob
           end

    return unless blob

    unless blob.content_type.in?(%w[image/png image/jpeg image/jpg])
      errors.add(:home_carousel_banner, 'deve ser PNG ou JPG')
    end

    if blob.byte_size > 500.kilobytes
      errors.add(:home_carousel_banner, 'deve ter no máximo 500KB')
    end
  end
end
