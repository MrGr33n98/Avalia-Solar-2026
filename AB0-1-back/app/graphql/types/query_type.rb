# frozen_string_literal: true

# app/graphql/types/query_type.rb
module Types
  class QueryType < Types::BaseObject
    description 'Queries disponíveis no Avalia Solar GraphQL API'

    # ─────────────────────────────────────────────
    # company(slug: String!) — Detalhes de uma empresa
    # ─────────────────────────────────────────────
    field :company, Types::CompanyType, null: true do
      description 'Retorna uma empresa pelo slug'
      argument :slug, String, required: true
    end

    def company(slug:)
      Company.active.find_by(slug: slug) ||
        Company.active.find_by(id: slug)
    end

    # ─────────────────────────────────────────────
    # companies(...) — Listagem paginada com filtros
    # ─────────────────────────────────────────────
    field :companies, Types::CompaniesConnectionType, null: false, connection: false do
      description 'Lista empresas com filtros e paginação'
      argument :q, String, required: false, description: 'Busca textual'
      argument :city, String, required: false
      argument :state, String, required: false
      argument :category_id, ID, required: false
      argument :category_ids, [ID], required: false
      argument :verified, Boolean, required: false
      argument :featured, Boolean, required: false
      argument :sponsored, Boolean, required: false
      argument :min_rating, Float, required: false
      argument :serves_city, String, required: false
      argument :serves_state, String, required: false
      argument :segment, String, required: false
      argument :sort, String, required: false, default_value: 'recommended'
      argument :page, Integer, required: false, default_value: 1
      argument :limit, Integer, required: false, default_value: 20
      
      complexity ->(ctx, args, child_complexity) {
        limit = args[:limit] || 20
        child_complexity * limit
      }
    end

    def companies(
      q: nil, city: nil, state: nil,
      category_id: nil, category_ids: nil,
      verified: nil, featured: nil, sponsored: nil,
      min_rating: nil, serves_city: nil, serves_state: nil,
      segment: nil, sort: 'recommended',
      page: 1, limit: 20
    )
      ::Search::CompanySearchService.new(
        q: q,
        state: state,
        city: city,
        category_id: category_id,
        category_ids: category_ids,
        verified: verified,
        featured: featured,
        sponsored: sponsored,
        min_rating: min_rating,
        serves_city: serves_city,
        serves_state: serves_state,
        segment: segment,
        sort: sort,
        page: page,
        limit: limit
      ).call
    end

    # ─────────────────────────────────────────────
    # categories — Lista de categorias
    # ─────────────────────────────────────────────
    field :categories, [Types::CategoryType], null: false do
      description 'Lista categorias ativas'
      argument :featured, Boolean, required: false
      argument :limit, Integer, required: false
    end

    def categories(featured: nil, limit: nil)
      scope = Category.where(status: 'active').order(:name)
      scope = scope.where(featured: featured) unless featured.nil?
      scope = scope.limit(limit) if limit.present?
      scope
    end

    # ─────────────────────────────────────────────
    # search_suggestions — Autocomplete e sugestões
    # ─────────────────────────────────────────────
    field :search_suggestions, Types::SearchSuggestionsType, null: false do
      description 'Retorna sugestões estruturadas para autocomplete'
      argument :q, String, required: true, description: 'Texto da busca'
      argument :state, String, required: false
      argument :city, String, required: false
      argument :limit, Integer, required: false, default_value: 5
    end

    def search_suggestions(q:, state: nil, city: nil, limit: 5)
      ::Search::SuggestionService.new(
        q: q,
        state: state,
        city: city,
        limit: limit
      ).call
    end

    # ─────────────────────────────────────────────
    # active_states — Siglas de estados ativos
    # ─────────────────────────────────────────────
    field :active_states, [String], null: false do
      description 'Retorna a lista de siglas de estados ativos'
    end

    def active_states
      Locations::BrLocations.states.map { |state| state['acronym'] }
    end

    # ─────────────────────────────────────────────
    # active_cities — Cidades ativas por estado
    # ─────────────────────────────────────────────
    field :active_cities, [String], null: false do
      description 'Retorna a lista de cidades ativas para um estado'
      argument :state, String, required: true
    end

    def active_cities(state:)
      state_code = state.to_s.strip.upcase
      state_code.present? ? Locations::BrLocations.cities_for(state_code) : []
    end

    # ─────────────────────────────────────────────
    # active_locations — Pares cidade/estado ativos
    # ─────────────────────────────────────────────
    field :active_locations, [Types::LocationPairType], null: false do
      description 'Retorna todos os pares de cidades e estados ativos no portal'
    end

    def active_locations
      Company.distinct.pluck(:state, :city).compact
             .map { |state, city| { state: state, city: city } }
             .sort_by { |loc| [loc[:state], loc[:city]] }
    end

    # ─────────────────────────────────────────────
    # category_tree — Árvore de categorias
    # ─────────────────────────────────────────────
    field :category_tree, [Types::CategoryType], null: false do
      description 'Retorna a árvore de categorias ativas (raízes e seus filhos)'
    end

    def category_tree
      Category.where(status: 'active', parent_id: nil)
              .includes(:icon_attachment)
              .order(:name)
    end

    # ─────────────────────────────────────────────
    # banners — Banners promocionais filtrados
    # ─────────────────────────────────────────────
    field :banners, [Types::BannerType], null: false do
      description 'Lista banners promocionais ativos com filtros'
      argument :position, String, required: false
      argument :category_id, ID, required: false
      argument :slot_key, String, required: false
      argument :company_id, ID, required: false
      argument :limit, Integer, required: false
      argument :state, String, required: false
      argument :city, String, required: false
    end

    def banners(position: nil, category_id: nil, slot_key: nil, company_id: nil, limit: nil, state: nil, city: nil)
      query = ::Banner.currently_active

      query = query.where(position: position) if position.present?

      if slot_key.present? && ::Banner.column_names.include?('slot_key')
        query = query.where(slot_key: slot_key)
      end

      if company_id.present? && ::Banner.column_names.include?('company_id')
        query = query.where('company_id = ? OR company_id IS NULL', company_id)
      end

      if category_id.present?
        if ::Banner.reflect_on_association(:categories) && ActiveRecord::Base.connection.table_exists?(:banners_categories)
          query = query.left_joins(:categories)
                       .where('categories.id = ? OR categories.id IS NULL', category_id)
                       .distinct
        elsif ::Banner.column_names.include?('category_id')
          query = query.where(category_id: category_id)
        end
      end

      if state.present? && ::Banner.column_names.include?('target_states')
        state_code = state.to_s.strip.upcase
        query = query.where("target_states = '{}' OR target_states IS NULL OR ? = ANY(target_states)", state_code)
      end

      if city.present? && ::Banner.column_names.include?('target_cities')
        city_name = city.to_s.strip
        query = query.where("target_cities = '{}' OR target_cities IS NULL OR ? = ANY(target_cities)", city_name)
      end

      if ::Banner.column_names.include?('priority')
        query = query.order(priority: :asc, sponsored: :desc, created_at: :desc)
      elsif ::Banner.column_names.include?('sponsored')
        query = query.order(sponsored: :desc, created_at: :desc)
      else
        query = query.order(created_at: :desc)
      end

      query = query.limit(limit) if limit.present? && limit.positive?
      query.includes(:categories, :company, image_attachment: :blob)
    end

    private

    def apply_sort(scope, sort)
      case sort.to_s
      when 'rating', 'rating_desc'
        scope.order(rating_avg: :desc, rating_count: :desc)
      when 'reviews_count', 'reviews_desc'
        scope.order(rating_count: :desc, rating_avg: :desc)
      when 'newest', 'created_at'
        scope.order(created_at: :desc)
      when 'name', 'name_asc'
        scope.order(name: :asc)
      when 'name_desc'
        scope.order(name: :desc)
      else
        # 'recommended' — mesmo critério de ranking do REST
        scope.order(
          Arel.sql(
            "CASE WHEN sponsored THEN 1 ELSE 0 END DESC, " \
            "(COALESCE(rating_avg, 0) * 0.6 + COALESCE(rating_count, 0) * 0.0001) DESC, " \
            "COALESCE(rating_avg, 0) DESC, name ASC"
          )
        )
      end
    end
  end
end
