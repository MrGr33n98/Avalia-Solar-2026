class Category < ApplicationRecord
  include SeoStandardizable
  include QueryCacheable # TASK-016: Query Caching

  # permissions_config is a native JSON column, no need to serialize manually in Rails 7+
  # serialize :permissions_config, JSON
  # Associations
  # =========================
  belongs_to :parent, class_name: 'Category', optional: true
  has_many :children, class_name: 'Category', foreign_key: :parent_id, dependent: :nullify

  has_and_belongs_to_many :companies, join_table: :categories_companies,
                                      after_add: :update_metrics_on_change,
                                      after_remove: :update_metrics_on_change

  has_and_belongs_to_many :products, join_table: :categories_products,
                                     after_add: :update_metrics_on_change,
                                     after_remove: :update_metrics_on_change
  has_many :articles
  has_many :rating_criteria, dependent: :destroy
  has_one_attached :banner
  has_one_attached :icon
  has_and_belongs_to_many :banners, join_table: :banners_categories
  has_one :category_lead_wizard, dependent: :destroy
  accepts_nested_attributes_for :category_lead_wizard, allow_destroy: true

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validate :validate_parent_constraints
  validate :validate_banner_technical_requirements

  # =========================
  # Scopes
  # =========================
  scope :roots,     -> { where(parent_id: nil) }
  scope :featured,  -> { where(featured: true) }
  scope :active,    -> { where(status: 'active') }
  scope :by_region, ->(state) { joins(:companies).where(companies: { state: state }).distinct }
  scope :by_min_rating, ->(rating) { where('average_rating >= ?', rating) }
  scope :by_max_price, ->(price) { where('average_price <= ?', price) }
  scope :containing_products_by_price, ->(price) { joins(:products).where('products.price <= ?', price).distinct }

  # =========================
  # Cacheable Queries - TASK-016
  # =========================
  cacheable_query :featured, expires_in: 1.hour do
    where(featured: true)
      .includes(:products, :companies)
      .order(name: :asc)
  end

  cacheable_query :active, expires_in: 1.hour do
    where(status: 'active')
      .order(name: :asc)
  end

  # =========================
  # Ransack configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description created_at updated_at
      featured status kind seo_url seo_title short_description
      companies_count products_count average_rating average_price views_count
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies products banner_attachment banner_blob parent children]
  end

  # =========================
  # Instance Methods
  # =========================

  def tags
    t = []
    t << 'Destaque' if featured?
    t << 'Mais procurado' if (companies_count || 0) > 10
    t << 'Novidade' if created_at && created_at > 30.days.ago
    t
  end

  def banner_url
    return nil unless banner.attached?

    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      Rails.application.routes.url_helpers.rails_storage_proxy_url(banner, options)
    rescue StandardError => e
      Rails.logger.error("Error generating category banner URL: #{e.message}")
      nil
    end
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

  def total_reviews_count
    companies.joins(:reviews).count
  end

  def ancestor_ids
    ids = []
    current = parent
    while current
      break if ids.include?(current.id)

      ids << current.id
      current = current.parent
    end
    ids
  end

  def effective_rating_criteria
    # Bubble-up sequence: Global (nil) -> Ancestors (root-to-parent) -> Self
    # We use ancestor_ids.reverse to get root-to-parent order
    path_ids = [nil] + ancestor_ids.reverse + [id]

    # Pre-fetch all active criteria in the path
    all_path_criteria = RatingCriterion.active.where(category_id: path_ids).to_a

    # Group by category_id for efficient lookup during merge
    grouped = all_path_criteria.group_by(&:category_id)

    resolved = {}
    path_ids.each do |cat_id|
      (grouped[cat_id] || []).each do |rc|
        resolved[rc.slug] = rc
      end
    end

    # Return as array, sorted by position
    resolved.values.sort_by(&:position)
  end

  def depth
    current = parent
    seen_ids = Set.new([id].compact)
    depth = 0

    while current
      break if seen_ids.include?(current.id)

      seen_ids.add(current.id)
      depth += 1
      current = current.parent
    end

    depth
  end

  def update_metrics!
    active_companies = companies.where(status: 'active').count
    active_products = products.where(status: 'active')

    update_columns(
      companies_count: active_companies,
      products_count: active_products.count,
      average_rating: companies.joins(:reviews).average('reviews.rating') || 0.0,
      average_price: active_products.average(:price) || 0.0
    )
  end

  private

  def validate_parent_constraints
    return if parent_id.blank?

    if parent_id == id
      errors.add(:parent_id, 'nÃ£o pode ser a prÃ³pria categoria')
      return
    end

    seen_ids = Set.new([id].compact)
    current = parent

    while current
      if seen_ids.include?(current.id)
        errors.add(:parent_id, 'gera um ciclo na hierarquia')
        break
      end

      seen_ids.add(current.id)
      current = current.parent
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
end
