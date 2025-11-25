class Category < ApplicationRecord
  include QueryCacheable # TASK-016: Query Caching
  
  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :companies, join_table: :categories_companies
  has_and_belongs_to_many :products,  join_table: :categories_products
  has_one_attached :banner
  has_many :banners

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true

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
      featured status seo_url seo_title short_description
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies products banner_attachment banner_blob]
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
          companies: { only: %i[id name description] },
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

    # Add cached counts
    json[:products_count] = cached_products_count
    json[:companies_count] = companies.count

    json
  end

  # =========================
  # URL helpers for banner attachment
  # =========================
  def banner_url
    return nil unless banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating category banner URL: #{e.message}")
    nil
  end

  # =========================
  # Cache Management
  # =========================
  
  private

  def should_clear_cache?
    # Clear cache on all changes
    true
  end
end
