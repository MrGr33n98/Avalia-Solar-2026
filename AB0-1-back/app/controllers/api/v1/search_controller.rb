# app/controllers/api/v1/search_controller.rb
module Api
  module V1
    class SearchController < BaseController
      def all
        @search_error_stages = []

        query = params[:q].to_s.strip
        state = params[:state].presence
        city  = params[:city].presence
        sort  = params[:sort].presence # 'rating' | 'name' | 'created_at'
        page  = (params[:page] || 1).to_i
        per   = (params[:per_page] || 10).to_i
        category_id = params[:category_id].presence

        # GEO args
        latitude = params[:latitude].presence
        longitude = params[:longitude].presence
        radius_km = params[:radius_km].presence

        legacy_results = safe_legacy_results(query, state: state, city: city, category_id: category_id)

        company_results = safe_company_results(
          query: query,
          state: state,
          city: city,
          category_id: category_id,
          sort: sort,
          page: page,
          per: per,
          latitude: latitude,
          longitude: longitude,
          radius_km: radius_km
        )

        track_search_event(
          query: query,
          state: state,
          city: city,
          category_id: category_id,
          results_count: safe_company_total_count(company_results) + safe_count(legacy_results[:products])
        )

        # ordenação simples sem quebrar nada
        case sort
        when 'name'
          legacy_results[:products]   = order_legacy_collection(legacy_results[:products], :name)
          legacy_results[:categories] = order_legacy_collection(legacy_results[:categories], :name)
        when 'created_at'
          legacy_results[:products]   = order_legacy_collection(legacy_results[:products], created_at: :desc)
          legacy_results[:categories] = order_legacy_collection(legacy_results[:categories], created_at: :desc)
          legacy_results[:articles]   = order_legacy_collection(legacy_results[:articles], created_at: :desc)
        end

        products   = paginate_legacy_collection(legacy_results[:products], page: page, per: per)
        categories = paginate_legacy_collection(legacy_results[:categories], page: page, per: per)
        articles   = paginate_legacy_collection(legacy_results[:articles], page: page, per: per)

        companies_json = company_results[:nodes].filter_map { |company| serialize_company_result(company) }
        products_json = serialize_products(products)
        categories_json = serialize_categories(categories)
        articles_json = serialize_articles(articles)

        meta = {
          total_count: {
            companies: safe_company_total_count(company_results),
            products: safe_count(legacy_results[:products]),
            categories: safe_count(legacy_results[:categories]),
            articles: safe_count(legacy_results[:articles])
          },
          page: page,
          per_page: per
        }
        meta[:error_stage] = @search_error_stages.uniq.join(',') if @search_error_stages.present?

        render json: {
          companies: companies_json,
          products: products_json,
          categories: categories_json,
          articles: articles_json,
          meta: meta
        }
      end

      def suggest
        q = params[:q].to_s.strip
        state = params[:state].presence
        city = params[:city].presence
        limit = (params[:limit] || 5).to_i

        results = ::Search::SuggestionService.new(
          q: q,
          state: state,
          city: city,
          limit: limit
        ).call

        render json: {
          companies: results[:companies],
          products: results[:products],
          categories: results[:categories],
          articles: results[:articles]
        }
      end

      def companies
        query = params[:q].to_s.strip
        state = params[:state].presence
        city = params[:city].presence

        adapter = ActiveRecord::Base.connection.adapter_name.downcase
        if adapter.include?('sqlite')
          q_lower = query.downcase
          companies = Company.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q OR LOWER(address) LIKE :q',
                                    q: "%#{q_lower}%")
                             .by_state(state)
                             .by_city(city)
                             .limit(10)
        else
          companies = Company.where('name ILIKE :q OR description ILIKE :q OR address ILIKE :q', q: "%#{query}%")
                             .by_state(state)
                             .by_city(city)
                             .limit(10)
        end

        render json: companies
      end

      def products
        query = params[:q].to_s.strip
        adapter = ActiveRecord::Base.connection.adapter_name.downcase
        if adapter.include?('sqlite')
          q_lower = query.downcase
          products = Product.where('LOWER(name) LIKE :q OR LOWER(description) LIKE :q', q: "%#{q_lower}%")
                            .limit(10)
        else
          products = Product.where('name ILIKE :q OR description ILIKE :q', q: "%#{query}%")
                            .limit(10)
        end

        render json: products
      end

      def articles
        query = params[:q].to_s.strip
        adapter = ActiveRecord::Base.connection.adapter_name.downcase
        if adapter.include?('sqlite')
          q_lower = query.downcase
          articles = Article.where('LOWER(title) LIKE :q OR LOWER(content) LIKE :q', q: "%#{q_lower}%")
                            .limit(10)
        else
          articles = Article.where('title ILIKE :q OR content ILIKE :q', q: "%#{query}%")
                            .limit(10)
        end

        render json: articles
      end

      private

      def safe_legacy_results(query, state:, city:, category_id:)
        ::SearchService.new(query, state: state, city: city, category_id: category_id).call
      rescue StandardError => e
        record_search_error(
          'legacy_search',
          e,
          query: query,
          state: state,
          city: city,
          category_id: category_id
        )
        { companies: Company.none, products: Product.none, categories: Category.none, articles: Article.none }
      end

      def safe_company_results(
        query:, state:, city:, category_id:, sort:, page:, per:, latitude:, longitude:, radius_km:
      )
        raw_results = ::Search::CompanySearchService.new(
          q: query, state: state, city: city, category_id: category_id,
          sort: sort, page: page, limit: per,
          latitude: latitude, longitude: longitude, radius_km: radius_km
        ).call
        normalize_company_results(raw_results, page: page, per: per)
      rescue StandardError => e
        record_search_error(
          'company_search',
          e,
          query: query,
          state: state,
          city: city,
          category_id: category_id,
          sort: sort
        )
        empty_company_results(page: page, per: per)
      end

      def normalize_company_results(results, page:, per:)
        page_info = results.is_a?(Hash) && results[:page_info].is_a?(Hash) ? results[:page_info] : {}
        nodes = results.is_a?(Hash) ? Array(results[:nodes]) : []
        total_count = page_info[:total_count] || page_info['total_count'] || nodes.count
        total_pages =
          page_info[:total_pages] || page_info['total_pages'] || (total_count.to_f / per).ceil
        total_pages = 1 if total_pages.to_i.zero?

        {
          nodes: nodes,
          page_info: {
            current_page: page_info[:current_page] || page_info['current_page'] || page,
            total_pages: total_pages,
            total_count: total_count,
            per_page: page_info[:per_page] || page_info['per_page'] || per,
            has_next_page: page_info[:has_next_page] || page_info['has_next_page'] || page < total_pages,
            has_previous_page: page_info[:has_previous_page] || page_info['has_previous_page'] || page > 1
          },
          facets: results.is_a?(Hash) ? (results[:facets] || {}) : {},
          map: results.is_a?(Hash) ? (results[:map] || empty_map_results) : empty_map_results
        }
      end

      def empty_map_results
        { companies: [], total_count: 0 }
      end

      def empty_company_results(page:, per:)
        {
          nodes: [],
          page_info: {
            current_page: page,
            total_pages: 1,
            total_count: 0,
            per_page: per,
            has_next_page: false,
            has_previous_page: page > 1
          },
          facets: {},
          map: { companies: [], total_count: 0 }
        }
      end

      def paginate_legacy_collection(collection, page:, per:)
        if collection.respond_to?(:limit) && collection.respond_to?(:offset)
          collection.limit(per).offset((page - 1) * per)
        else
          Array(collection).slice((page - 1) * per, per) || []
        end
      rescue StandardError => e
        Rails.logger.error("[SearchController] legacy pagination failed: #{e.class} #{e.message}")
        []
      end

      def order_legacy_collection(collection, *)
        return collection.order(*) if collection.respond_to?(:order)

        collection
      rescue StandardError => e
        Rails.logger.error("[SearchController] legacy order failed: #{e.class} #{e.message}")
        collection
      end

      def safe_count(collection)
        return 0 if collection.blank?

        collection.respond_to?(:count) ? collection.count : Array(collection).count
      rescue StandardError => e
        Rails.logger.error("[SearchController] count failed: #{e.class} #{e.message}")
        0
      end

      def safe_company_total_count(company_results)
        company_results.dig(:page_info, :total_count).to_i
      rescue StandardError => e
        record_search_error('company_count', e)
        0
      end

      def serialize_company_result(company)
        ::Search::CompanyResultSerializer.new(company).as_json
      rescue StandardError => e
        record_search_error('company_serialization', e, company_id: safe_company_id(company))
        nil
      end

      def safe_company_id(company)
        company.respond_to?(:id) ? company.id : nil
      rescue StandardError
        nil
      end

      def serialize_products(products)
        products.as_json(only: %i[id name description price company_id image_url])
      rescue StandardError => e
        record_search_error('product_serialization', e)
        []
      end

      def serialize_categories(categories)
        categories.filter_map do |category|
          ::CategorySerializer.new(category).as_json
        rescue StandardError => e
          record_search_error('category_serialization', e, category_id: category&.id)
          nil
        end
      rescue StandardError => e
        record_search_error('category_serialization', e)
        []
      end

      def serialize_articles(articles)
        articles.as_json(only: %i[id title slug published_at])
      rescue StandardError => e
        record_search_error('article_serialization', e)
        []
      end

      def record_search_error(stage, exception, context = {})
        @search_error_stages ||= []
        @search_error_stages << stage
        Rails.logger.error(
          "[SearchController] stage=#{stage} error=#{exception.class}: #{exception.message} " \
          "request_id=#{request&.request_id.inspect} context=#{context.compact.inspect}"
        )
      end

      def track_search_event(query:, state:, city:, category_id:, results_count:)
        Analytics::TrackEventService.call(
          event_type: 'search_performed',
          company_id: nil,
          user: current_user,
          metadata: request_metadata.merge(
            query: query,
            state: state,
            city: city,
            category_id: category_id,
            results_count: results_count
          )
        )
      rescue StandardError => e
        Rails.logger.warn("[SearchController] analytics tracking skipped: #{e.class} #{e.message}")
      end
    end
  end
end
