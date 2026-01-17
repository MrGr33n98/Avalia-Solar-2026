class Category < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching
  
  # =========================
  # Associations
  # =========================
  belongs_to :parent, class_name: 'Category', optional: true
  has_many :children, class_name: 'Category', foreign_key: :parent_id, dependent: :nullify
  has_many :badges, dependent: :destroy
  accepts_nested_attributes_for :badges, allow_destroy: true
  
  has_and_belongs_to_many :companies, join_table: :categories_companies,
                          after_add: :update_metrics_on_change,
                          after_remove: :update_metrics_on_change

  has_and_belongs_to_many :products, join_table: :categories_products,
                          after_add: :update_metrics_on_change,
                          after_remove: :update_metrics_on_change
  has_many :articles
  has_one_attached :banner
  has_one_attached :icon
  has_and_belongs_to_many :banners, join_table: :banners_categories

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true

  # =========================
  # Scopes
  # =========================
  scope :roots,     -> { where(parent_id: nil) }
  scope :featured,  -> { where(featured: true) }
  scope :active,    -> { where(status: 'active') }
  scope :by_region, ->(state) { joins(:companies).where(companies: { state: state }).distinct }
  scope :by_min_rating, ->(rating) { where("average_rating >= ?", rating) }
  # Use new average_price column for category filtering
  scope :by_max_price, ->(price) { where("average_price <= ?", price) }
  # Keep legacy product-based scope just in case, or rename it
  scope :containing_products_by_price, ->(price) { joins(:products).where("products.price <= ?", price).distinct }

  # =========================
  # Cacheable Queries - TASK-016
  # =========================
  
  # Featured categories with products
  cacheable_query :featured, expires_in: 1.hour do
    where(featured: true)
      .includes(:products, :companies)
      .order(name: :asc)
  end

  # Active categories
  cacheable_query :active, expires_in: 1.hour do
    where(status: 'active')
      .order(name: :asc)
  end

  # Categories with companies
  cacheable_query :with_companies, expires_in: 30.minutes do
    joins(:companies)
      .distinct
      .order(name: :asc)
  end

  # Top categories by product count
  cacheable_query :top_by_products, expires_in: 1.hour do
    left_joins(:products)
      .group(:id)
      .order('COUNT(products.id) DESC')
      .limit(10)
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
    %w[companies products banner_attachment banner_blob]
  end

  # =========================
  # Metrics Updates
  # =========================
  def update_metrics!
    active_companies = companies.where(status: 'active').count
    active_products = products.where(status: 'active')
    
    update_columns(
      companies_count: active_companies,
      products_count: active_products.count,
      average_rating: companies.joins(:reviews).average('reviews.rating') || 0.0,
      average_price: active_products.average(:price) || 0.0
    )
    clear_related_caches
  end



  # =========================
  # Instance Methods
  # =========================
  
  def tags
    t = []
    t << 'Destaque' if featured?
    t << 'Mais procurado' if companies_count.to_i > 10
    t << 'Novidade' if created_at > 30.days.ago
    t
  end

  def depth
    parent ? parent.depth + 1 : 0
  end

  # =========================
  # Instance Methods with Caching
  # =========================

  # Get companies for this category (cached)
  def cached_companies
    cache_method(:companies, expires_in: 30.minutes) do
      companies.to_a
    end
  end

  # Get products for this category (cached)
  def cached_products
    cache_method(:products, expires_in: 30.minutes) do
      products.to_a
    end
  end

  # Count products (cached)
  def cached_products_count
    cache_method(:products_count, expires_in: 1.hour) do
      products.count
    end
  end

  # =========================
  # JSON serialization
  # =========================
  def as_json(options = {})
    json = super(
      options.merge(
        include: {
          companies: { only: %i[id name description], methods: %i[logo_url] },
          products: { only: %i[id name price] }
        },
        except: %i[created_at updated_at]
      )
    )

    # Add banner URL if attached
    if banner.attached?
      begin
        json[:banner_url] = Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
      rescue StandardError => e
        Rails.logger.error("Error generating category banner URL: #{e.message}")
        json[:banner_url] = nil
      end
    else
      json[:banner_url] = nil
    end

    # Add icon URL if attached
    if icon.attached?
      begin
        json[:icon_url] = Rails.application.routes.url_helpers.rails_blob_url(icon, only_path: false)
      rescue StandardError => e
        Rails.logger.error("Error generating category icon URL: #{e.message}")
        json[:icon_url] = nil
      end
    else
      json[:icon_url] = nil
    end

    # Add cached counts (using DB columns)
    json[:products_count] = self[:products_count] || 0
    json[:companies_count] = self[:companies_count] || 0
    json[:average_rating] = (self[:average_rating] || 0.0).to_f.round(1)
    json[:average_price] = (self[:average_price] || 0.0).to_f.round(2)
    json[:views_count] = self[:views_count] || 0
    json[:reviews_count] = total_reviews_count

    # Add tags and badges
    json[:tags] = tags
    json[:badges] = badges.map do |b|
      {
        name: b.name,
        description: b.description,
        image_url: (Rails.application.routes.url_helpers.rails_blob_url(b.badge_image, only_path: false) if b.badge_image.attached?)
      }
    end

    json
  end

  # =========================
  # URL helpers for attachments
  # =========================
  def banner_url
    return nil unless banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating category banner URL: #{e.message}")
    nil
  end

  def icon_url
    return nil unless icon.attached?

    Rails.application.routes.url_helpers.rails_blob_url(icon, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating category icon URL: #{e.message}")
    nil
  end

  # Total de reviews das empresas dessa categoria
  def total_reviews_count
    companies.joins(:reviews).count
  end

  # =========================
  # Cache Management
  # =========================
  
  private

  def update_metrics_on_change(_item)
    update_metrics!
  end

  # Extend QueryCacheable invalidation to also expire API caches
  # so changes from ActiveAdmin/seed/import are reflected immediately.
  def clear_related_caches
    begin
      super
    rescue StandardError => e
      Rails.logger.error("Category cache invalidation (query) failed: #{e.message}")
    end

    begin
      # Ensure QueryCacheable class-level caches are cleared for Category.
      self.class.clear_model_cache if self.class.respond_to?(:clear_model_cache)
    rescue StandardError => e
      Rails.logger.error("Category cache invalidation (model) failed: #{e.message}")
    end

    begin
      clear_category_api_caches
    rescue StandardError => e
      Rails.logger.error("Category cache invalidation (api) failed: #{e.message}")
    end
  end

  def clear_category_api_caches
    # Collection caches (index with params)
    expire_cache_pattern('categories_controller/index/categories')

    # Show caches (by id and banners)
    expire_cache_pattern("categories/show/#{id}")
    expire_cache_pattern("categories/#{id}/banners")

    # Slug-based caches
    slug_values = [seo_url, previous_changes['seo_url']&.first]
    slug_values.compact.uniq.each do |slug|
      expire_cache_pattern("categories/slug/#{slug}")
    end
  end

  def expire_cache_pattern(pattern)
    if defined?(REDIS) && REDIS
      keys = REDIS.keys("cache:#{pattern}*")
      keys.each { |key| Rails.cache.delete(key.sub('cache:', '')) }
    else
      Rails.cache.delete_matched("#{pattern}*")
    end
  end

  def should_clear_cache?
    # Clear cache on all changes
    true
  end
end
