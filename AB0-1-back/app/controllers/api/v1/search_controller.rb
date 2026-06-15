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

        legacy_results = ::SearchService.new(query, state: state, city: city, category_id: category_id).call

        company_results = ::Search::CompanySearchService.new(
          q: query, state: state, city: city, category_id: category_id,
          sort: sort, page: page, limit: per,
          latitude: latitude, longitude: longitude, radius_km: radius_km
        ).call

        # Track search event
        Analytics::TrackEventService.call(
          event_type: 'search_performed',
          company_id: nil, # Global search
          user: current_user,
          metadata: request_metadata.merge(
            query: query,
            state: state,
            city: city,
            category_id: category_id,
            results_count: company_results[:page_info][:total_count] + legacy_results[:products].count
          )
        )

        # ordenação simples sem quebrar nada
        case sort
        when 'name'
          legacy_results[:products]   = legacy_results[:products].order(:name)
          legacy_results[:categories] = legacy_results[:categories].order(:name)
        when 'created_at'
          legacy_results[:products]   = legacy_results[:products].order(created_at: :desc)
          legacy_results[:categories] = legacy_results[:categories].order(created_at: :desc)
          legacy_results[:articles]   = legacy_results[:articles].order(created_at: :desc)
        end

        products   = legacy_results[:products].limit(per).offset((page - 1) * per)
        categories = legacy_results[:categories].limit(per).offset((page - 1) * per)
        articles   = legacy_results[:articles].limit(per).offset((page - 1) * per)

        companies_json = company_results[:nodes].map do |c|
          json = ::CompanySerializer.new(c).as_json
          json['distance_km'] = c.try(:distance_km)
          json['latitude'] = c.latitude
          json['longitude'] = c.longitude
          json
        end

        render json: {
          companies: companies_json,
          products: products.as_json(only: %i[id name description price company_id image_url]),
          categories: categories.map { |c| ::CategorySerializer.new(c).as_json },
          articles: articles.as_json(only: %i[id title slug published_at]),
          meta: {
            total_count: {
              companies: company_results[:page_info][:total_count],
              products: legacy_results[:products].count,
              categories: legacy_results[:categories].count,
              articles: legacy_results[:articles].count
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
    end
  end
end
