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
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope = Company.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q OR LOWER(state) LIKE :q OR LOWER(city) LIKE :q OR LOWER(address) LIKE :q', q: "%#{q_lower}%")
    else
      scope = Company.where('name ILIKE :q OR description ILIKE :q OR state ILIKE :q OR city ILIKE :q OR address ILIKE :q', q: "%#{@query}%")
    end
    scope = scope.by_state(@state).by_city(@city)
    scope = scope.joins(:categories).where(categories: { id: @category_id }) if @category_id.present?
    scope
  end

  def search_products
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      Product.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q', q: "%#{q_lower}%")
    else
      Product.where('name ILIKE :q OR description ILIKE :q', q: "%#{@query}%")
    end
  end

  def search_categories
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      Category.where('LOWER(name) LIKE :q OR LOWER(short_description) LIKE :q OR LOWER(description) LIKE :q', q: "%#{q_lower}%")
    else
      Category.where('name ILIKE :q OR short_description ILIKE :q OR description ILIKE :q', q: "%#{@query}%")
    end
  end

  def search_articles
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      Article.where('LOWER(title) LIKE :q OR LOWER(content) LIKE :q', q: "%#{q_lower}%")
    else
      Article.where('title ILIKE :q OR content ILIKE :q', q: "%#{@query}%")
    end
  end
end
