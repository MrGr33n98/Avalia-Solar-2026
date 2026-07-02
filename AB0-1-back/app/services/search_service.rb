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
      articles: search_articles,
      reviews: search_reviews
    }
  end

  private

  def empty_results
    { companies: [], products: [], categories: [], articles: [], reviews: [] }
  end

  def search_companies
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    scope = Company.active.includes(:categories)

    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope = scope.left_joins(:categories).where(
        <<~SQL.squish,
          LOWER(companies.name) LIKE :q OR
          LOWER(COALESCE(companies.slug, '')) LIKE :q OR
          LOWER(COALESCE(companies.description, '')) LIKE :q OR
          LOWER(COALESCE(companies.short_description, '')) LIKE :q OR
          LOWER(COALESCE(companies.state, '')) LIKE :q OR
          LOWER(COALESCE(companies.city, '')) LIKE :q OR
          LOWER(COALESCE(companies.address, '')) LIKE :q OR
          LOWER(COALESCE(categories.name, '')) LIKE :q OR
          LOWER(COALESCE(categories.description, '')) LIKE :q
        SQL
        q: "%#{q_lower}%"
      )
    else
      scope = scope.left_joins(:categories).where(
        <<~SQL.squish,
          companies.name ILIKE :q OR
          COALESCE(companies.slug, '') ILIKE :q OR
          COALESCE(companies.description, '') ILIKE :q OR
          COALESCE(companies.short_description, '') ILIKE :q OR
          COALESCE(companies.state, '') ILIKE :q OR
          COALESCE(companies.city, '') ILIKE :q OR
          COALESCE(companies.address, '') ILIKE :q OR
          COALESCE(categories.name, '') ILIKE :q OR
          COALESCE(categories.description, '') ILIKE :q
        SQL
        q: "%#{@query}%"
      )
    end

    scope = scope.by_state(@state).by_city(@city)
    scope = scope.joins(:categories).where(categories: { id: @category_id }) if @category_id.present?
    scope.distinct
  end

  def search_products
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    scope = Product.respond_to?(:active_status) ? Product.active_status : Product.all
    scope = scope.includes(:brand, :categories, :company)
    scope = scope.left_joins(:brand, :categories, :company)

    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope = scope.where(
        <<~SQL.squish,
          LOWER(products.name) LIKE :q OR
          LOWER(COALESCE(products.description, '')) LIKE :q OR
          LOWER(COALESCE(products.short_description, '')) LIKE :q OR
          LOWER(COALESCE(brands.name, '')) LIKE :q OR
          LOWER(COALESCE(categories.name, '')) LIKE :q OR
          LOWER(COALESCE(companies.name, '')) LIKE :q OR
          LOWER(COALESCE(companies.city, '')) LIKE :q OR
          LOWER(COALESCE(companies.state, '')) LIKE :q
        SQL
        q: "%#{q_lower}%"
      )
    else
      scope = scope.where(
        <<~SQL.squish,
          products.name ILIKE :q OR
          COALESCE(products.description, '') ILIKE :q OR
          COALESCE(products.short_description, '') ILIKE :q OR
          COALESCE(brands.name, '') ILIKE :q OR
          COALESCE(categories.name, '') ILIKE :q OR
          COALESCE(companies.name, '') ILIKE :q OR
          COALESCE(companies.city, '') ILIKE :q OR
          COALESCE(companies.state, '') ILIKE :q
        SQL
        q: "%#{@query}%"
      )
    end

    scope.distinct
  end

  def search_categories
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    scope = Category.respond_to?(:active) ? Category.active : Category.all
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope.where(
        <<~SQL.squish,
          LOWER(categories.name) LIKE :q OR
          LOWER(COALESCE(categories.short_description, '')) LIKE :q OR
          LOWER(COALESCE(categories.description, '')) LIKE :q
        SQL
        q: "%#{q_lower}%"
      )
    else
      scope.where(
        <<~SQL.squish,
          categories.name ILIKE :q OR
          COALESCE(categories.short_description, '') ILIKE :q OR
          COALESCE(categories.description, '') ILIKE :q
        SQL
        q: "%#{@query}%"
      )
    end
  end

  def search_articles
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    scope = Article.respond_to?(:published) ? Article.published : Article.all
    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope.where(
        'LOWER(articles.title) LIKE :q OR LOWER(COALESCE(articles.content, \'\')) LIKE :q',
        q: "%#{q_lower}%"
      )
    else
      scope.where(
        'articles.title ILIKE :q OR COALESCE(articles.content, \'\') ILIKE :q',
        q: "%#{@query}%"
      )
    end
  end

  def search_reviews
    adapter = ActiveRecord::Base.connection.adapter_name.downcase
    scope = Review.approved_only.includes(:company, :category).left_joins(:company, :category)

    if adapter.include?('sqlite')
      q_lower = @query.to_s.downcase
      scope.where(
        <<~SQL.squish,
          LOWER(COALESCE(reviews.comment, '')) LIKE :q OR
          LOWER(COALESCE(reviews.headline, '')) LIKE :q OR
          LOWER(COALESCE(companies.name, '')) LIKE :q OR
          LOWER(COALESCE(categories.name, '')) LIKE :q
        SQL
        q: "%#{q_lower}%"
      ).distinct
    else
      scope.left_joins(:company, :category)
           .where(
             <<~SQL.squish,
               COALESCE(reviews.comment, '') ILIKE :q OR
               COALESCE(reviews.headline, '') ILIKE :q OR
               COALESCE(companies.name, '') ILIKE :q OR
               COALESCE(categories.name, '') ILIKE :q
             SQL
             q: "%#{@query}%"
           )
           .distinct
    end
  end
end
