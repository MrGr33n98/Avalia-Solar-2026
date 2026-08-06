# frozen_string_literal: true

# Builds a contextual catalog payload for a company/category pair.
# In addition to products and services in the requested category, it returns
# discovery data for empty states: suggested products from the same company in
# other categories, related categories that have products/services, and similar
# companies when allowed by the seller's plan.
class CompanyCatalogBuilder
  MAX_SUGGESTED_PRODUCTS = 8
  MAX_RELATED_CATEGORIES = 8
  MAX_SIMILAR_COMPANIES = 3

  def initialize(company:, category:)
    @company = company
    @category = category
  end

  def call
    products = fetch_category_products
    services = fetch_category_services

    payload = {
      products: products,
      services: services
    }

    if products.empty? && services.empty?
      payload.merge!(discovery_payload)
    else
      payload.merge!(
        suggested_products: [],
        related_categories: [],
        similar_companies: []
      )
    end

    payload
  end

  private

  attr_reader :company, :category

  # Products that belong to the requested category AND are owned by or linked
  # to the company.
  def fetch_category_products
    linked_ids = CompanyProduct.visible.where(company_id: company.id).pluck(:product_id)

    product_ids = Product
                    .active_status
                    .joins(:categories)
                    .where(categories: { id: category.id })
                    .where('products.id IN (?) OR products.company_id = ?', linked_ids.presence || [0], company.id)
                    .pluck(:id)
                    .uniq

    Product
      .where(id: product_ids)
      .includes(:brand, :company, :categories, company_products: :product_offers, images_attachments: :blob)
      .order(Arel.sql('products.featured DESC NULLS LAST, products.name ASC'))
  end

  def fetch_category_services
    company.company_services.visible.where(category_id: category.id).order(name: :asc)
  end

  def discovery_payload
    suggested = suggested_products
    related = related_categories(suggested.map(&:categories).flatten.uniq)
    similar = similar_companies

    {
      suggested_products: suggested,
      related_categories: related,
      similar_companies: similar
    }
  end

  # Products from the same company in other categories, ordered by semantic
  # proximity to the requested category, then featured, rating and price.
  def suggested_products
    company_product_ids = company_product_ids_for_company
    return [] if company_product_ids.blank?

    excluded_category_ids = [category.id]

    Product
      .active_status
      .joins(:categories)
      .where(id: company_product_ids)
      .where.not(categories: { id: excluded_category_ids })
      .includes(:brand, :company, :categories, company_products: :product_offers, images_attachments: :blob)
      .limit(MAX_SUGGESTED_PRODUCTS)
      .sort_by { |product| suggestion_sort_score(product) }
  end

  def company_product_ids_for_company
    owned_ids = Product.active_status.where(company_id: company.id).pluck(:id)
    linked_ids = CompanyProduct.visible.where(company_id: company.id).pluck(:product_id)
    (owned_ids + linked_ids).uniq
  end

  def suggestion_sort_score(product)
    product_category_ids = product.categories.map(&:id)
    proximity = related_category_ids_for(category).count { |id| product_category_ids.include?(id) }
    featured = product.featured ? 1 : 0
    rating = product.company&.rating_avg.to_f
    price = -1 * (product.price.to_f > 0 ? product.price.to_f : 0)

    [proximity, featured, rating, price]
  end

  # Categories associated with the company that have at least one visible
  # product or service, excluding the currently requested category.
  def related_categories(suggested_product_categories = [])
    category_ids = company.categories.active.where.not(id: category.id).pluck(:id)
    return [] if category_ids.blank?

    counts = category_product_counts(category_ids)
    service_counts = category_service_counts(category_ids)

    category_ids
      .map { |id| [id, counts.fetch(id, 0) + service_counts.fetch(id, 0)] }
      .select { |_, count| count.positive? }
      .sort_by { |id, count| [-count, Category.find(id).name] }
      .first(MAX_RELATED_CATEGORIES)
      .map { |id, count| category_payload(id, count) }
  end

  def category_product_counts(category_ids)
    Product
      .active_status
      .joins(:categories)
      .where(categories: { id: category_ids })
      .where('products.company_id = ? OR products.id IN (?)', company.id, company_product_ids_for_company)
      .group('categories.id')
      .count
  end

  def category_service_counts(category_ids)
    company.company_services.visible.where(category_id: category_ids).group(:category_id).count
  end

  def category_payload(category_id, count)
    related = Category.find_by(id: category_id)
    return nil unless related

    {
      id: related.id,
      name: related.name,
      seo_url: related.seo_url,
      product_count: count
    }
  end

  # Other active companies that have visible products in the requested category.
  # Only returned when the current company explicitly allows competitor discovery.
  def similar_companies
    return [] unless company.allows_competitor_suggestions?

    similar_ids = Product
                    .active_status
                    .joins(:categories, :company)
                    .where(categories: { id: category.id })
                    .where.not(companies: { id: company.id })
                    .where(companies: { status: 'active' })
                    .group('companies.id')
                    .having('COUNT(products.id) > 0')
                    .order(
                      Arel.sql(
                        'companies.verified DESC NULLS LAST, ' \
                        'companies.rating_avg DESC NULLS LAST, ' \
                        'companies.rating_count DESC NULLS LAST'
                      )
                    )
                    .limit(MAX_SIMILAR_COMPANIES)
                    .pluck('companies.id')

    Company
      .where(id: similar_ids)
      .map do |similar_company|
        {
          id: similar_company.id,
          name: similar_company.name,
          slug: similar_company.slug,
          logo_url: similar_company.logo_url,
          rating_avg: similar_company.rating_avg,
          city: similar_company.city,
          state: similar_company.state,
          verified: similar_company.verified,
          product_count: similar_company.products.active_status.joins(:categories).where(categories: { id: category.id }).count
        }
      end
  end

  def related_category_ids_for(reference_category)
    return @related_category_ids if defined?(@related_category_ids)

    ids = [reference_category.id]
    ids << reference_category.parent_id if reference_category.parent_id.present?
    ids.concat(reference_category.children.pluck(:id)) if reference_category.respond_to?(:children)
    @related_category_ids = ids.compact.uniq
  end
end
