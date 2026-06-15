# frozen_string_literal: true

module Search
  # Centraliza a busca, o ranking comercial (Score Composto) e as agregações (facetas) de empresas
  # Integra o OpenSearch via Searchkick com fallback resiliente para PostgreSQL
  class CompanySearchService
    def initialize(
      q: nil, state: nil, city: nil,
      category_id: nil, category_ids: nil,
      min_rating: nil, verified: nil, featured: nil, sponsored: nil,
      serves_city: nil, serves_state: nil, segment: nil,
      sort: 'recommended', page: 1, limit: 20,
      # === GEO ===
      latitude: nil, longitude: nil, radius_km: nil, map_bounds: nil
    )
      @q = q.to_s.strip
      @state = state.presence
      @city = city.presence
      @category_id = category_id.presence
      @category_ids = category_ids.presence
      @min_rating = min_rating.presence
      @verified = verified
      @featured = featured
      @sponsored = sponsored
      @serves_city = serves_city.presence
      @serves_state = serves_state.presence
      @segment = segment.presence
      @sort = sort.presence || 'recommended'
      @page = [page.to_i, 1].max
      @limit = [[limit.to_i, 1].max, 100].min
      # GEO
      @latitude = latitude.presence&.to_f
      @longitude = longitude.presence&.to_f
      @radius_km = radius_km.presence&.to_i
      @map_bounds = map_bounds # Hash: { north:, south:, east:, west: }
    end

    def call
      result = if search_enabled? && opensearch_responsive?
                 search_via_opensearch
               else
                 search_via_postgresql
               end

      if result && result[:nodes] && result[:nodes].empty? && @q.present?
        log_zero_results(search_enabled? && opensearch_responsive? ? 'opensearch' : 'postgresql')
      end

      result
    rescue StandardError => e
      Rails.logger.error "[Search] Erro ao buscar no OpenSearch, caindo para PostgreSQL: #{e.message}"
      result = search_via_postgresql
      if result && result[:nodes] && result[:nodes].empty? && @q.present?
        log_zero_results('postgresql_fallback')
      end
      result
    end

    private

    def search_enabled?
      ENV['SEARCH_ENABLED'] == 'true'
    end

    def geo_enabled?
      ENV['SEARCH_GEO_ENABLED'] == 'true'
    end

    def has_geo_filter?
      geo_enabled? && (@latitude.present? && @longitude.present? && @radius_km.present?) ||
        (@map_bounds.present?)
    end

    def opensearch_responsive?
      Searchkick.client.ping
    rescue StandardError
      false
    end

    def log_zero_results(search_type)
      begin
        SearchZeroResult.create!(
          query: @q,
          category_id: @category_id || @category_ids&.first,
          state: @state || @serves_state,
          city: @city || @serves_city,
          search_type: search_type
        )
      rescue => e
        Rails.logger.error "[Search] Erro ao salvar SearchZeroResult: #{e.message}"
      end

      begin
        Analytics::PostHogService.capture(
          'search_zero_results',
          {
            query: @q,
            category_id: @category_id || @category_ids&.first,
            state: @state || @serves_state,
            city: @city || @serves_city,
            search_type: search_type
          },
          distinct_id: 'anonymous_search'
        )
      rescue => e
        Rails.logger.error "[Search] Erro ao enviar evento de busca vazia para o PostHog: #{e.message}"
      end
    end

    # Busca utilizando OpenSearch (Searchkick) com Score Composto e Agregações (aggs)
    def search_via_opensearch
      where_clause = {}

      # Filtros geográficos principais
      where_clause[:state] = @state.to_s.upcase if @state.present?
      where_clause[:city] = @city if @city.present?

      # Filtros de cobertura geográfica
      if @serves_state.present?
        state_code = ::Locations::CoverageNormalizer.normalize_state(@serves_state) rescue @serves_state
        where_clause[:coverage_states] = state_code.to_s.upcase if state_code.present?
      end
      if @serves_city.present?
        where_clause[:coverage_cities] = @serves_city
      end

      # Filtro de segmento
      where_clause[:segment] = @segment if @segment.present?

      # Filtros de categoria
      if @category_id.present?
        where_clause[:category_ids] = @category_id.to_i
      elsif @category_ids.present?
        where_clause[:category_ids] = @category_ids.map(&:to_i)
      end

      # Booleanos
      where_clause[:verified] = true if @verified == true
      where_clause[:verified] = false if @verified == false
      where_clause[:featured] = true if @featured == true
      where_clause[:featured] = false if @featured == false
      where_clause[:sponsored] = true if @sponsored == true
      where_clause[:sponsored] = false if @sponsored == false

      # Nota mínima
      where_clause[:rating_avg] = { gte: @min_rating.to_f } if @min_rating.present?

      searchkick_options = {
        where: where_clause,
        page: @page,
        per_page: @limit,
        aggs: {
          category_ids: { limit: 15 },
          state: { limit: 10 },
          city: { limit: 20 }
        },
        includes: %i[categories badges],
        load: true
      }

      # Se for ordenação recomendada, aplica o Score Composto (Algoritmo de Ranking Comercial)
      if @sort == 'recommended'
        # Impulsiona empresas no ranking com base no status de Patrocinada, Verificada, Destaque,
        # notas médias (rating_avg) e volume de avaliações (reviews_count)
        searchkick_options[:boost_where] = {
          sponsored: { value: true, factor: 1000 },
          verified: { value: true, factor: 5 },
          featured: { value: true, factor: 3 }
        }

        searchkick_options[:boost_by] = {
          rating_avg: { factor: 5.0 },
          reviews_count: { factor: 0.01 }
        }
        # O OpenSearch ordena os resultados pelo score composto (_score desc) automaticamente
      else
        # Caso contrário, aplica a ordenação estática tradicional selecionada
        searchkick_options[:order] = case @sort
                                     when 'rating', 'rating_desc'
                                       { rating_avg: :desc, reviews_count: :desc }
                                     when 'reviews_count', 'reviews_desc'
                                       { reviews_count: :desc, rating_avg: :desc }
                                     when 'newest', 'created_at'
                                       { created_at: :desc }
                                     when 'name', 'name_asc'
                                       { name: :asc }
                                     when 'name_desc'
                                       { name: :desc }
                                     end
      end

      search_query = @q.presence || '*'
      results = Company.search(search_query, **searchkick_options)

      nodes = results.to_a

      # Calcula distance_km para cada empresa quando busca tem origem geo
      if has_geo_filter? && @latitude.present? && @longitude.present?
        nodes = nodes.map do |company|
          next company unless company.latitude.present? && company.longitude.present?

          dist = Geo::HaversineCalculator.distance_km(
            @latitude, @longitude,
            company.latitude.to_f, company.longitude.to_f
          )
          company.define_singleton_method(:distance_km) { dist&.round(1) } if dist
          company
        end
      end

      # Mapeia facetas/agregações
      facets = {
        categories: results.aggs&.dig('category_ids', 'buckets')&.map { |b| { key: b['key'].to_s, count: b['doc_count'] } } || [],
        cities: results.aggs&.dig('city', 'buckets')&.map { |b| { key: b['key'].to_s, count: b['doc_count'] } } || [],
        states: results.aggs&.dig('state', 'buckets')&.map { |b| { key: b['key'].to_s, count: b['doc_count'] } } || []
      }

      {
        nodes: nodes,
        page_info: {
          current_page: @page,
          total_pages: results.total_pages,
          total_count: results.total_count,
          per_page: @limit,
          has_next_page: @page < results.total_pages,
          has_previous_page: @page > 1
        },
        facets: facets,
        map: build_map_payload(nodes)
      }
    end

    # Monta o payload simplificado do mapa (apenas empresas com coordenadas)
    def build_map_payload(nodes)
      map_companies = nodes.select { |c| c.latitude.present? && c.longitude.present? }
      {
        companies: map_companies,
        total_count: map_companies.size
      }
    end

    # Fallback utilizando queries PostgreSQL clássicas
    def search_via_postgresql
      scope = Company.active.includes(:categories, :badges)

      if @q.present?
        adapter = ActiveRecord::Base.connection.adapter_name.downcase
        if adapter.include?('sqlite')
          q_lower = @q.downcase
          scope = scope.where(
            'LOWER(companies.name) LIKE :q OR LOWER(companies.description) LIKE :q OR LOWER(companies.state) LIKE :q OR LOWER(companies.city) LIKE :q OR LOWER(companies.address) LIKE :q',
            q: "%#{q_lower}%"
          )
        else
          scope = scope.where(
            'companies.name ILIKE :q OR companies.description ILIKE :q OR companies.state ILIKE :q OR companies.city ILIKE :q OR companies.address ILIKE :q',
            q: "%#{@q}%"
          )
        end
      end

      # Filtros geográficos principais
      scope = scope.where(state: @state.to_s.upcase) if @state.present?
      scope = scope.where(city: @city) if @city.present?

      # Cobertura geográfica
      if @serves_state.present?
        state_code = ::Locations::CoverageNormalizer.normalize_state(@serves_state) rescue nil
        scope = scope.serving_state(state_code) if state_code.present?
      end
      if @serves_city.present?
        scope = scope.serving_city(@serves_city, @serves_state)
      end

      # Filtro de segmento
      scope = scope.where(segment: @segment) if @segment.present?

      # Filtros de categoria
      if @category_id.present?
        scope = scope.joins(:categories).where(categories: { id: @category_id })
      elsif @category_ids.present?
        scope = scope.joins(:categories).where(categories: { id: @category_ids })
      end

      scope = scope.where(verified: @verified) unless @verified.nil?
      scope = scope.where(featured: @featured) unless @featured.nil?
      scope = scope.where(sponsored: @sponsored) unless @sponsored.nil?
      # === GEO: Filtro por raio ou bounding box (fallback PostgreSQL sem OpenSearch) ===
      if has_geo_filter? && ENV['SEARCH_GEO_FALLBACK_POSTGRES'] == 'true'
        if @radius_km.present? && @latitude.present? && @longitude.present?
          Rails.logger.info "[Search] GEO fallback PostgreSQL: raio #{@radius_km}km de (#{@latitude}, #{@longitude})"
          scope = Geo::HaversineCalculator.scope_within_radius(
            scope, lat: @latitude, lng: @longitude, radius_km: @radius_km
          )
        end

        if @map_bounds.present?
          bounds = @map_bounds
          scope = scope.where(
            'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
            bounds[:south].to_f, bounds[:north].to_f,
            bounds[:west].to_f, bounds[:east].to_f
          )
        end
      end

      scope = scope.where('rating_avg >= ?', @min_rating.to_f) if @min_rating.present?

      scope = apply_postgresql_sort(scope)

      # Computa facetas baseadas no escopo filtrado antes da paginação
      facets = compute_postgresql_facets(scope)

      total_count = scope.count
      total_pages = (total_count.to_f / @limit).ceil
      total_pages = 1 if total_pages.zero?

      nodes = scope.offset((@page - 1) * @limit).limit(@limit).to_a

      # Calcula distance_km via Haversine em Ruby quando busca por raio
      if has_geo_filter? && @latitude.present? && @longitude.present?
        nodes = nodes.map do |company|
          next company unless company.latitude.present? && company.longitude.present?

          # Se o scope_within_radius já injetou via SELECT, read_attribute busca o valor
          dist = company.try(:distance_km) ||
                 Geo::HaversineCalculator.distance_km(
                   @latitude, @longitude,
                   company.latitude.to_f, company.longitude.to_f
                 )
          company.define_singleton_method(:distance_km) { dist&.round(1) } if dist
          company
        end
      end

      {
        nodes: nodes,
        page_info: {
          current_page: @page,
          total_pages: total_pages,
          total_count: total_count,
          per_page: @limit,
          has_next_page: @page < total_pages,
          has_previous_page: @page > 1
        },
        facets: facets,
        map: build_map_payload(nodes)
      }
    end

    def apply_postgresql_sort(scope)
      case @sort
      when 'rating', 'rating_desc'
        scope.order(rating_avg: :desc, rating_count: :desc)
      when 'reviews_count', 'reviews_desc'
        scope.order(rating_count: :desc, rating_avg: :desc)
      when 'newest', 'created_at'
        scope.order(created_at: :desc)
      when 'name', 'name_asc'
        scope.order('companies.name ASC')
      when 'name_desc'
        scope.order('companies.name DESC')
      else
        # recommended
        scope.order(
          Arel.sql(
            "CASE WHEN sponsored THEN 1 ELSE 0 END DESC, " \
            "(COALESCE(rating_avg, 0) * 0.6 + COALESCE(rating_count, 0) * 0.0001) DESC, " \
            "COALESCE(rating_avg, 0) DESC, companies.name ASC"
          )
        )
      end
    end

    def compute_postgresql_facets(scope)
      categories = scope.unscope(:order)
                        .joins(:categories)
                        .group('categories.id', 'categories.name')
                        .limit(15)
                        .count
                        .map { |(id, name), count| { key: "#{id}:#{name}", count: count } }

      cities = scope.unscope(:order)
                    .group(:city)
                    .limit(20)
                    .count
                    .compact
                    .map { |city, count| { key: city, count: count } }

      states = scope.unscope(:order)
                    .group(:state)
                    .limit(10)
                    .count
                    .compact
                    .map { |state, count| { key: state, count: count } }

      {
        categories: categories,
        cities: cities,
        states: states
      }
    rescue StandardError => e
      Rails.logger.error "[Search] Falha ao computar facetas SQL: #{e.message}"
      { categories: [], cities: [], states: [] }
    end
  end
end
