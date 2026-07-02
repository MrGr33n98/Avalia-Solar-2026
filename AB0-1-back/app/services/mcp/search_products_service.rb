# frozen_string_literal: true

module Mcp
  class SearchProductsService < BaseService
    def call
      query = required!(:query, 'Informe o produto, marca ou categoria.').to_s.strip
      term = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
      scope = Product.active_status.includes(:brand, :categories, :company)
      scope = scope.left_joins(:brand, :categories).where(
        'unaccent(lower(products.name)) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(products.description, \'\'))) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(brands.name, \'\'))) LIKE unaccent(lower(:term)) OR ' \
        'unaccent(lower(COALESCE(categories.name, \'\'))) LIKE unaccent(lower(:term))', term: term
      )
      products = scope.distinct.order(featured: :desc, created_at: :desc).limit(limit)

      {
        products: products.map { |product| serialize(product) },
        count: products.length
      }
    end

    private

    def serialize(product)
      {
        id: product.id,
        name: product.name,
        description: product.short_description.presence || product.description,
        brand: product.brand&.name,
        categories: product.categories.map(&:name),
        price: product.price&.to_f,
        image_url: product.image_url,
        company: product.company && { id: product.company.id, name: product.company.name, slug: product.company.slug },
        url: "/products/#{product.id}"
      }
    end
  end
end
