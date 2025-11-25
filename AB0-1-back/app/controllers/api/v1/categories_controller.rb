# app/controllers/api/v1/categories_controller.rb
module Api
  module V1
  class CategoriesController < Api::V1::BaseController
      include Cacheable # TASK-015: Enable caching
      include Paginatable # TASK-017: Enable pagination
      
      before_action :set_category, only: %i[show update destroy companies products]
      after_action :expire_categories_cache, only: %i[create update destroy]

      # =========================
      # GET /categories
      # =========================
      def index
        cache_key = cache_key_for('categories', params.except(:page, :per_page))
        
        cached_json(cache_key, expires_in: 1.hour) do
          query = Category.all

          # Filtrar por status (só se a coluna existir)
          if Category.column_names.include?('status') && params[:status].present?
            query = query.where(status: params[:status])
          end

          # Filtrar por featured (só se a coluna existir)
          if Category.column_names.include?('featured') && params[:featured].present?
            featured = ActiveModel::Type::Boolean.new.cast(params[:featured])
            query = query.where(featured: featured)
          end

          # Aplicar limite manual (apenas se não estiver usando paginação)
          # Se page ou per_page estiverem presentes, usar paginação ao invés do limit
          if params[:limit].present? && params[:limit].to_i.positive? && !params[:page].present?
            query = query.limit(params[:limit].to_i)
          end

          # Inclui companies apenas se associação existir
          query = query.includes(:companies) if Category.reflect_on_association(:companies)

          # Apply pagination if page parameter is present
          if params[:page].present?
            paginated = paginate(query)
            set_pagination_headers(paginated)
            {
              data: paginated.map(&:as_json),
              meta: { pagination: pagination_metadata(paginated) }
            }
          else
            # Return all results without pagination metadata
            query.map(&:as_json)
          end
        end
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("Categories not found: #{e.message}")
        render json: { error: 'Categorias não encontradas' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories error: #{e.message}\n#{e.backtrace.take(5).join("\n")}")
        render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
      end

      # =========================
      # GET /categories/:id
      # =========================
      def show
        cache_key = "categories/show/#{@category.id}/#{@category.updated_at.to_i}"
        
        cached_json(cache_key, expires_in: 1.hour) do
          @category.as_json
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#show error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#companies error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#banners error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#products error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue StandardError => e
        Rails.logger.error("Categories#create error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#update error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      # =========================
      # DELETE /categories/:id
      # =========================
      def destroy
        @category.destroy
        render json: { message: 'Categoria excluída' }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#destroy error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error("Categories#show_by_slug error: #{e.message}")
        render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
      end

      private

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
