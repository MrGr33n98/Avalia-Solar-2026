# frozen_string_literal: true

module Search
  # Centraliza a lógica de autocomplete/sugestões de busca rápida
  # Integra busca de empresas via OpenSearch (Searchkick) com fallback para SQL
  class SuggestionService
    def initialize(q: nil, state: nil, city: nil, limit: 5)
      @q = q.to_s.strip
      @state = normalize_state(state)
      @city = city.to_s.strip.presence
      @city_normalized = normalize_search_value(@city)
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

    def normalize_state(value)
      ::Locations::CoverageNormalizer.normalize_state(value)
    rescue StandardError
      value.to_s.strip.upcase.presence
    end

    def normalize_search_value(value)
      I18n.transliterate(value.to_s)
          .downcase
          .gsub(/[^a-z0-9]+/, ' ')
          .squeeze(' ')
          .strip
          .presence
    end

    def suggest_via_opensearch
      companies = Company.search(
        @q,
        fields: [
          { name: :word_start },
          { city: :word_start },
          { city_normalized: :word_start },
          { category_names: :word_start },
          :description
        ],
        match: :word_start,
        where: {
          state: @state,
          city_normalized: @city_normalized
        }.compact,
        misspellings: { below: 5 },
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
        scope = scope.left_joins(:categories).where(
          'LOWER(companies.name) LIKE :q OR LOWER(companies.description) LIKE :q OR LOWER(companies.state) LIKE :q OR LOWER(companies.city) LIKE :q OR LOWER(companies.address) LIKE :q OR LOWER(categories.name) LIKE :q',
          q: "%#{q_lower}%"
        ).distinct
      else
        scope = scope.left_joins(:categories).where(
          <<~SQL.squish,
            unaccent(companies.name) ILIKE unaccent(:q) OR
            unaccent(COALESCE(companies.description, '')) ILIKE unaccent(:q) OR
            unaccent(COALESCE(companies.short_description, '')) ILIKE unaccent(:q) OR
            unaccent(COALESCE(companies.state, '')) ILIKE unaccent(:q) OR
            unaccent(COALESCE(companies.city, '')) ILIKE unaccent(:q) OR
            unaccent(COALESCE(companies.address, '')) ILIKE unaccent(:q) OR
            unaccent(COALESCE(categories.name, '')) ILIKE unaccent(:q)
          SQL
          q: "%#{@q}%"
        ).distinct
      end

      # Filtros geográficos simples (se o model tiver esses métodos)
      scope = scope.where(state: @state) if @state.present?
      scope = apply_city_filter(scope) if @city.present?

      scope.limit(@limit).to_a
    end

    def apply_city_filter(scope)
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      if adapter.include?('sqlite')
        scope.where('LOWER(companies.city) = ?', @city.to_s.downcase)
      else
        scope.where('unaccent(LOWER(companies.city)) = unaccent(LOWER(?))', @city)
      end
    end

    def sql_search_products
      adapter = ActiveRecord::Base.connection.adapter_name.downcase
      scope = Product.all
      if adapter.include?('sqlite')
        q_lower = @q.downcase
        scope = scope.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q', q: "%#{q_lower}%")
      else
        scope = scope.where(
          'unaccent(name) ILIKE unaccent(:q) OR unaccent(COALESCE(description, \'\')) ILIKE unaccent(:q)',
          q: "%#{@q}%"
        )
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
        scope = scope.where(
          'unaccent(name) ILIKE unaccent(:q) OR unaccent(COALESCE(short_description, \'\')) ILIKE unaccent(:q) OR unaccent(COALESCE(description, \'\')) ILIKE unaccent(:q)',
          q: "%#{@q}%"
        )
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
        scope = scope.where(
          'unaccent(title) ILIKE unaccent(:q) OR unaccent(COALESCE(content, \'\')) ILIKE unaccent(:q)',
          q: "%#{@q}%"
        )
      end
      scope.limit(@limit).to_a
    end
  end
end
