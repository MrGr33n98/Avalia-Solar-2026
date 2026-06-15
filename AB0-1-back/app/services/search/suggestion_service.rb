# frozen_string_literal: true

module Search
  # Centraliza a lógica de autocomplete/sugestões de busca rápida
  # Integra busca de empresas via OpenSearch (Searchkick) com fallback para SQL
  class SuggestionService
    def initialize(q: nil, state: nil, city: nil, limit: 5)
      @q = q.to_s.strip
      @state = state.presence
      @city = city.presence
      @limit = (limit || 5).to_i
    end

    def call
      if search_enabled? && opensearch_responsive?
        suggest_via_opensearch
      else
        suggest_via_postgresql
      end
    rescue StandardError => e
      Rails.logger.error "[Search] Erro ao sugerir no OpenSearch, caindo para PostgreSQL: #{e.message}"
      suggest_via_postgresql
    end

    private

    def search_enabled?
      ENV['SEARCH_ENABLED'] == 'true'
    end

    def opensearch_responsive?
      Searchkick.client.ping
    rescue StandardError
      false
    end

    def suggest_via_opensearch
      companies = Company.search(
        @q,
        fields: %i[name city state],
        match: :word_start,
        where: {
          state: @state.to_s.upcase,
          city: @city
        }.compact,
        limit: @limit,
        load: true
      )

      {
        companies: companies.to_a,
        products: sql_search_products,
        categories: sql_search_categories,
        articles: sql_search_articles
      }
    end

    def suggest_via_postgresql
      {
        companies: sql_search_companies,
        products: sql_search_products,
        categories: sql_search_categories,
        articles: sql_search_articles
      }
    end

    def sql_search_companies
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      scope = Company.active
      if adapter.include?('sqlite')
        q_lower = @q.downcase
        scope = scope.where(
          'LOWER(name) LIKE :q OR LOWER(description) LIKE :q OR LOWER(state) LIKE :q OR LOWER(city) LIKE :q OR LOWER(address) LIKE :q',
          q: "%#{q_lower}%"
        )
      else
        scope = scope.where(
          'name ILIKE :q OR description ILIKE :q OR state ILIKE :q OR city ILIKE :q OR address ILIKE :q',
          q: "%#{@q}%"
        )
      end
      
      # Filtros geográficos simples (se o model tiver esses métodos)
      scope = scope.where(state: @state.to_s.upcase) if @state.present? && scope.respond_to?(:state)
      scope = scope.where(city: @city) if @city.present? && scope.respond_to?(:city)
      
      scope.limit(@limit).to_a
    end

    def sql_search_products
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      scope = Product.all
      if adapter.include?('sqlite')
        q_lower = @q.downcase
        scope = scope.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q', q: "%#{q_lower}%")
      else
        scope = scope.where('name ILIKE :q OR description ILIKE :q', q: "%#{@q}%")
      end
      scope.limit(@limit).to_a
    end

    def sql_search_categories
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      scope = Category.where(status: 'active')
      if adapter.include?('sqlite')
        q_lower = @q.downcase
        scope = scope.where('LOWER(name) LIKE :q OR LOWER(short_description) LIKE :q OR LOWER(description) LIKE :q',
                            q: "%#{q_lower}%")
      else
        scope = scope.where('name ILIKE :q OR short_description ILIKE :q OR description ILIKE :q', q: "%#{@q}%")
      end
      scope.limit(@limit).to_a
    end

    def sql_search_articles
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      scope = Article.all
      if adapter.include?('sqlite')
        q_lower = @q.downcase
        scope = scope.where('LOWER(title) LIKE :q OR LOWER(content) LIKE :q', q: "%#{q_lower}%")
      else
        scope = scope.where('title ILIKE :q OR content ILIKE :q', q: "%#{@q}%")
      end
      scope.limit(@limit).to_a
    end
  end
end
