# app/controllers/api/v1/search_controller.rb
module Api
  module V1
    class SearchController < BaseController
      def all
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

        company_results = ::Search::CompanySearchService.new(
          q: query, state: state, city: city, category_id: category_id,
          sort: sort, page: page, limit: per,
          latitude: latitude, longitude: longitude, radius_km: radius_km
        ).call

        track_search_event(
          query: query,
          state: state,
          city: city,
          category_id: category_id,
          results_count: company_results[:page_info][:total_count] + safe_count(legacy_results[:products])
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

        render json: {
          companies: companies_json,
          products: products.as_json(only: %i[id name description price company_id image_url]),
          categories: categories.map { |c| ::CategorySerializer.new(c).as_json },
          articles: articles.as_json(only: %i[id title slug published_at]),
          meta: {
            total_count: {
              companies: company_results[:page_info][:total_count],
              products: safe_count(legacy_results[:products]),
              categories: safe_count(legacy_results[:categories]),
              articles: safe_count(legacy_results[:articles])
            },
            page: page,
            per_page: per
          }
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
        Rails.logger.error(
          "[SearchController] legacy search failed: #{e.class} #{e.message} " \
          "query=#{query.inspect} state=#{state.inspect} city=#{city.inspect} category_id=#{category_id.inspect}"
        )
        { companies: Company.none, products: Product.none, categories: Category.none, articles: Article.none }
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

      def order_legacy_collection(collection, *args)
        return collection.order(*args) if collection.respond_to?(:order)

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

      def serialize_company_result(company)
        json = ::CompanySerializer.new(company).as_json
        json['distance_km'] = company.try(:distance_km)
        json['latitude'] = company.latitude
        json['longitude'] = company.longitude
        json
      rescue StandardError => e
        Rails.logger.error("[SearchController] company serialization failed company=#{company&.id}: #{e.class} #{e.message}")
        nil
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
