# app/controllers/api/v1/categories_controller.rb
module Api
  module V1
  class CategoriesController < Api::V1::BaseController
      include Cacheable # TASK-015: Enable caching
      include Paginatable # TASK-017: Enable pagination
      
      before_action :set_category, only: %i[show update destroy companies products]
      before_action :authenticate_api_user, only: %i[create update destroy]
      before_action :require_admin, only: %i[create update destroy]
      after_action :expire_categories_cache, only: %i[create update destroy]

      # Global Error Handling
      rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
      rescue_from StandardError, with: :handle_standard_error

      # =========================
      # GET /categories
      # =========================
      def index
        cache_key = cache_key_for('categories', params.except(:page, :per_page))
        
        cached_json(cache_key, expires_in: 1.hour) do
          query = Category.all

          if Category.column_names.include?('status') && params[:status].present?
            query = query.where(status: params[:status])
          end

          if Category.column_names.include?('featured') && params[:featured].present?
            featured = ActiveModel::Type::Boolean.new.cast(params[:featured])
            query = query.where(featured: featured)
          end

          if params[:limit].present? && params[:limit].to_i.positive? && !params[:page].present?
            query = query.limit(params[:limit].to_i)
          end

          query = query.includes(:companies) if Category.reflect_on_association(:companies)

          if params[:page].present?
            paginated = paginate(query)
            set_pagination_headers(paginated)
            {
              data: paginated.map(&:as_json),
              meta: { pagination: pagination_metadata(paginated) }
            }
          else
            results = query.to_a

            # Fallback: quando filtrado por featured e resultado vazio, retornar categorias ativas
            if params[:featured].present? && ActiveModel::Type::Boolean.new.cast(params[:featured]) && results.empty?
              fallback = Category.all
              if Category.column_names.include?('status')
                fallback = fallback.where(status: params[:status].presence || 'active')
              end
              if params[:limit].present? && params[:limit].to_i.positive?
                fallback = fallback.limit(params[:limit].to_i)
              end
              fallback = fallback.includes(:companies) if Category.reflect_on_association(:companies)
              results = fallback.to_a
            end

            results.map(&:as_json)
          end
        end
      end

      # =========================
      # GET /categories/:id
      # =========================
      def show
        cache_key = "categories/show/#{@category.id}/#{@category.updated_at.to_i}"
        
        cached_json(cache_key, expires_in: 1.hour) do
          @category.as_json
        end
      end

      # =========================
      # GET /categories/:id/companies
      # =========================
      def companies
        companies_scope = @category.companies

        if params[:status].present? && Company.column_names.include?('status')
          companies_scope = companies_scope.where(status: params[:status])
        end

        if params[:limit].present?
          companies_scope = companies_scope.limit(params[:limit].to_i)
        end

        render json: companies_scope.map { |c| CompanySerializer.new(c).as_json }, status: :ok
      end

      # =========================
      # GET /categories/:id/banners
      # =========================
      def banners
        cache_key = "categories/#{@category.id}/banners/#{@category.updated_at.to_i}"
        
        cached_json(cache_key, expires_in: 30.minutes) do
          banners_scope = @category.banners.where(active: true)
          if Banner.column_names.include?('start_date')
            banners_scope = banners_scope.where('start_date IS NULL OR start_date <= ?', Time.current)
          end
          if Banner.column_names.include?('end_date')
            banners_scope = banners_scope.where('end_date IS NULL OR end_date >= ?', Time.current)
          end
          
          if params[:limit].present?
            banners_scope = banners_scope.limit(params[:limit].to_i)
          end
          
          banners_scope.as_json(
            only: %i[id title link banner_type position],
            methods: :image_url
          )
        end
      end

      # =========================
      # GET /categories/:id/products
      # =========================
      def products
        products_scope = @category.products

        if params[:limit].present?
          products_scope = products_scope.limit(params[:limit].to_i)
        end

        render json: products_scope.as_json(only: %i[id name description price company_id image_url]), status: :ok
      end

      # =========================
      # POST /categories
      # =========================
      def create
        @category = Category.new(category_params)

        if @category.save
          render json: @category.as_json(
            only: %i[id name seo_url seo_title short_description description status featured]
          ), status: :created
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # =========================
      # PUT/PATCH /categories/:id
      # =========================
      def update
        if @category.update(category_params)
          render json: @category.as_json(
            only: %i[id name seo_url seo_title short_description description status featured]
          )
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # =========================
      # DELETE /categories/:id
      # =========================
      def destroy
        @category.destroy
        render json: { message: 'Categoria excluída' }, status: :ok
      end

      # =========================
      # GET /categories/slug/:slug
      # =========================
      def show_by_slug
        slug = params[:slug] || params[:id] # Support both slug param and id param
        @category = Category.find_by!(seo_url: slug)
        
        cache_key = "categories/slug/#{slug}/#{@category.updated_at.to_i}"
        
        cached_json(cache_key, expires_in: 1.hour) do
          @category.as_json
        end
      end

      private

      def record_not_found(e)
        Rails.logger.error("Category not found: #{e.message}")
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      end

      def handle_standard_error(e)
        Rails.logger.error("Categories error: #{e.message}\n#{e.backtrace.take(5).join("\n")}")
        render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
      end

      def set_category
        @category = Category.find(params[:id])
      end

      def category_params
        params.require(:category).permit(
          :name, :seo_url, :seo_title, :short_description,
          :description, :parent_id, :kind, :status, :featured
        )
      end

      # Expire all category caches when data changes
      def expire_categories_cache
        expire_cache('categories')
        Rails.logger.info("🗑️  Expired all category caches")
      end
    end
  end
end
