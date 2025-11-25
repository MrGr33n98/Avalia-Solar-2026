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

        results = SearchService.new(query, state: state, city: city, category_id: category_id).call

        # ordenação simples sem quebrar nada
        case sort
        when 'name'
          results[:companies]  = results[:companies].order(:name)
          results[:products]   = results[:products].order(:name)
          results[:categories] = results[:categories].order(:name)
        when 'created_at'
          results[:companies]  = results[:companies].order(created_at: :desc)
          results[:products]   = results[:products].order(created_at: :desc)
          results[:categories] = results[:categories].order(created_at: :desc)
          results[:articles]   = results[:articles].order(created_at: :desc)
        end

        companies  = results[:companies].limit(per).offset((page - 1) * per)
        products   = results[:products].limit(per).offset((page - 1) * per)
        categories = results[:categories].limit(per).offset((page - 1) * per)
        articles   = results[:articles].limit(per).offset((page - 1) * per)

        render json: {
          companies: companies.map { |c| CompanySerializer.new(c).as_json },
          products: products.as_json(only: %i[id name description price company_id image_url]),
          categories: categories.map { |c| CategorySerializer.new(c).as_json },
          articles: articles.as_json(only: %i[id title content]),
          meta: {
            total_count: {
              companies: results[:companies].count,
              products: results[:products].count,
              categories: results[:categories].count,
              articles: results[:articles].count
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

        companies_scope = Company.where(
          'name ILIKE :q OR description ILIKE :q OR state ILIKE :q OR city ILIKE :q',
          q: "%#{q}%"
        ).by_state(state).by_city(city)

        products_scope = Product.where('name ILIKE :q OR description ILIKE :q', q: "%#{q}%")
        categories_scope = Category.where('name ILIKE :q OR short_description ILIKE :q OR description ILIKE :q',
                                          q: "%#{q}%")
        articles_scope = Article.where('title ILIKE :q OR content ILIKE :q', q: "%#{q}%")

        render json: {
          companies: companies_scope.limit(limit),
          products: products_scope.limit(limit),
          categories: categories_scope.limit(limit),
          articles: articles_scope.limit(limit)
        }
      end

      def companies
        query = params[:q].to_s.strip
        state = params[:state].presence
        city = params[:city].presence

        companies = Company.where('name ILIKE :q OR description ILIKE :q', q: "%#{query}%")
                           .by_state(state)
                           .by_city(city)
                           .limit(10)

        render json: companies
      end

      def products
        query = params[:q].to_s.strip
        products = Product.where('name ILIKE :q OR description ILIKE :q', q: "%#{query}%")
                          .limit(10)

        render json: products
      end

      def articles
        query = params[:q].to_s.strip
        articles = Article.where('title ILIKE :q OR content ILIKE :q', q: "%#{query}%")
                          .limit(10)

        render json: articles
      end
    end
  end
end
