# app/services/search_service.rb
class SearchService
  def initialize(query, state: nil, city: nil, category_id: nil)
    @query = query
    @state = state
    @city = city
    @category_id = category_id
  end

  def call
    return empty_results if @query.blank?

    {
      companies: search_companies,
      products: search_products,
      categories: search_categories,
      articles: search_articles
    }
  end

  private

  def empty_results
    { companies: [], products: [], categories: [], articles: [] }
  end

  def search_companies
    scope = Company.where('name ILIKE :q OR description ILIKE :q OR state ILIKE :q OR city ILIKE :q', q: "%#{@query}%")
    scope = scope.by_state(@state).by_city(@city)
    scope = scope.joins(:categories).where(categories: { id: @category_id }) if @category_id.present?
    scope
  end

  def search_products
    Product.where('name ILIKE :q OR description ILIKE :q', q: "%#{@query}%")
  end

  def search_categories
    Category.where('name ILIKE :q OR short_description ILIKE :q OR description ILIKE :q', q: "%#{@query}%")
  end

  def search_articles
    Article.where('title ILIKE :q OR content ILIKE :q', q: "%#{@query}%")
  end
end
