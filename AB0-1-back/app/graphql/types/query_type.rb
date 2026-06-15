# frozen_string_literal: true

# app/graphql/types/query_type.rb
module Types
  class QueryType < Types::BaseObject
    description 'Queries disponíveis no Avalia Solar GraphQL API'

    # ─────────────────────────────────────────────
    # me — Usuário logado
    # ─────────────────────────────────────────────
    field :me, Types::UserType, null: true do
      description 'Retorna as informações do usuário logado'
    end

    # ─────────────────────────────────────────────
    # my_leads — Histórico de leads/orçamentos do usuário
    # ─────────────────────────────────────────────
    field :my_leads, Types::LeadsConnectionType, null: false, connection: false do
      description 'Retorna o histórico de leads do usuário logado'
      argument :status, String, required: false
      argument :page, Integer, required: false, default_value: 1
      argument :per_page, Integer, required: false, default_value: 10
    end

    # ─────────────────────────────────────────────
    # my_reviews — Histórico de avaliações do usuário
    # ─────────────────────────────────────────────
    field :my_reviews, Types::ReviewsConnectionType, null: false, connection: false do
      description 'Retorna o histórico de avaliações do usuário logado'
      argument :status, String, required: false
      argument :page, Integer, required: false, default_value: 1
      argument :per_page, Integer, required: false, default_value: 10
    end

    # ─────────────────────────────────────────────
    # articles(...) — Listagem de artigos do blog
    # ─────────────────────────────────────────────
    field :articles, Types::ArticlesConnectionType, null: false, connection: false do
      description 'Lista artigos publicados com filtros de categoria, busca textual e paginação'
      argument :category, String, required: false
      argument :q, String, required: false
      argument :page, Integer, required: false, default_value: 1
      argument :per_page, Integer, required: false, default_value: 10
    end

    # ─────────────────────────────────────────────
    # article(slug: String!) — Detalhes de um artigo
    # ─────────────────────────────────────────────
    field :article, Types::ArticleType, null: true do
      description 'Retorna um artigo publicado pelo slug'
      argument :slug, String, required: true
    end

    # ─────────────────────────────────────────────
    # compareFinancingOptions(...) — Simulação de financiamento
    # ─────────────────────────────────────────────
    field :compare_financing_options, [Types::FinancingOptionType], null: false do
      description 'Compara opções de financiamento com base no valor e parcelas'
      argument :amount, Float, required: true
      argument :installments, Integer, required: true
      argument :state, String, required: false
      argument :city, String, required: false
      argument :company_ids, [ID], required: false
      argument :audience, String, required: false
    end

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

    def articles(category: nil, q: nil, page: 1, per_page: 10)
      scope = ::Article.published

      if category.present?
        scope = scope.joins(:category).where('categories.seo_url = ? OR categories.name = ?', category, category)
      end

      if q.present?
        scope = scope.where('articles.title ILIKE ? OR articles.content ILIKE ?', "%#{q}%", "%#{q}%")
      end

      scope = scope.order(published_at: :desc)
      paginated = scope.page(page).per(per_page)

      {
        nodes: paginated,
        page_info: {
          current_page: paginated.current_page,
          total_pages: paginated.total_pages,
          total_count: paginated.total_count,
          per_page: per_page,
          has_next_page: !paginated.last_page?,
          has_previous_page: !paginated.first_page?
        }
      }
    end

    def article(slug:)
      ::Article.published.find_by(slug: slug)
    end

    def compare_financing_options(amount:, installments:, state: nil, city: nil, company_ids: nil, audience: nil)
      companies = ::Company.active
      companies = companies.where(id: company_ids) if company_ids.present?
      companies = companies.where(state: state) if state.present?
      companies = companies.where(city: city) if city.present?

      options_scope = ::FinancingOption.where(company_id: companies.pluck(:id)).where(active: true)
      
      if audience.present?
        normalized_aud = normalize_audience(audience)
        options_scope = options_scope.where(target_audience: normalized_aud)
      end

      results = []
      options_scope.each do |o|
        months = installments.positive? ? installments : (o.max_term_months || 12)
        rate_percent = (o.interest_rate_percent || 0).to_f
        i = rate_percent / 100.0
        monthly_payment =
          if i.positive?
            denom = (1 - ((1 + i)**(-months)))
            denom.zero? ? 0.0 : (amount * i / denom)
          else
            months.zero? ? 0.0 : (amount / months.to_f)
          end
        total_cost = monthly_payment * months
        cet_annual_percent = i.positive? ? (((1 + i)**12) - 1) * 100.0 : 0.0

        results << {
          id: o.id,
          company_id: o.company_id,
          institution_name: o.institution_name,
          credit_line: o.credit_line,
          target_audience: o.target_audience,
          max_term_months: o.max_term_months,
          grace_period_months: o.grace_period_months,
          interest_rate_percent: o.interest_rate_percent,
          interest_rate_details: o.interest_rate_details,
          active: o.active,
          monthly_payment: monthly_payment.round(2),
          total_cost: total_cost.round(2),
          cet_annual_percent: cet_annual_percent.round(2)
        }
      rescue StandardError => e
        Rails.logger.error("[compare_financing_options] Error calculating option #{o.id}: #{e.message}")
      end

      # Ordena do melhor para o pior: menor taxa primeiro
      results.sort_by { |r| [r[:interest_rate_percent] || Float::INFINITY, -(r[:max_term_months] || 0)] }
    end

    def me
      context[:current_user]
    end

    def my_leads(status: nil, page: 1, per_page: 10)
      raise GraphQL::ExecutionError.new("Autenticação necessária") if context[:current_user].nil?

      scope = ::Lead.where(email: context[:current_user].email)
      scope = scope.where(wizard_status: status) if status.present?
      scope = scope.order(created_at: :desc)

      paginated = scope.page(page).per(per_page)

      {
        nodes: paginated,
        page_info: {
          current_page: paginated.current_page,
          total_pages: paginated.total_pages,
          total_count: paginated.total_count,
          per_page: per_page,
          has_next_page: !paginated.last_page?,
          has_previous_page: !paginated.first_page?
        }
      }
    end

    def my_reviews(status: nil, page: 1, per_page: 10)
      raise GraphQL::ExecutionError.new("Autenticação necessária") if context[:current_user].nil?

      scope = ::Review.where(user_id: context[:current_user].id)
      
      if status.present?
        status_value = ::Review.statuses[status] || status
        scope = scope.where(status: status_value)
      end
      
      scope = scope.order(created_at: :desc)

      paginated = scope.page(page).per(per_page)

      {
        nodes: paginated,
        page_info: {
          current_page: paginated.current_page,
          total_pages: paginated.total_pages,
          total_count: paginated.total_count,
          per_page: per_page,
          has_next_page: !paginated.last_page?,
          has_previous_page: !paginated.first_page?
        }
      }
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

    def normalize_audience(value)
      v = value.to_s.strip.downcase
      return 'PF' if %w[pf pessoa_fisica fisica].include?(v)
      return 'PJ' if %w[pj pessoa_juridica juridica].include?(v)
      return 'Rural' if %w[rural campo agro].include?(v)

      value
    end
  end
end
