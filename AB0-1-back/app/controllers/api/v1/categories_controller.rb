# app/controllers/api/v1/categories_controller.rb
module Api
  module V1
    class CategoriesController < Api::V1::BaseController
      include Cacheable   # TASK-015: Enable caching
      include Paginatable # TASK-017: Enable pagination

      CATEGORY_JSON_FIELDS = %i[
        id name seo_url seo_title short_description description status featured
      ].freeze

      before_action :authenticate_api_user, only: %i[create update destroy]
      before_action :require_admin, only: %i[create update destroy]
      before_action :set_category, only: %i[show update destroy companies products banners]

      after_action :expire_categories_cache, only: %i[create update destroy]

      # Global Error Handling
      rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
      rescue_from StandardError, with: :handle_standard_error

      # =========================
      # GET /categories
      # Params:
      #   - view: string (optional) - 'cards' for optimized card view
      #   - featured: boolean (optional) - Filter by featured
      #   - status: string (optional) - Filter by status
      #   - limit: integer (optional) - Limit results
      #   - page: integer (optional) - Page number for pagination
      # =========================
      def index
        # MODO NOVO: Visualização otimizada para Cards
        if params[:view] == 'cards'
          return render_cards_view
        end

        # MODO LEGADO: Mantém compatibilidade com código existente
        cache_key = cache_key_for('categories', params.except(:page, :per_page))

        cached_json(cache_key, expires_in: 1.hour) do
          query = Category.all
          query = apply_category_filters(query)
          query = apply_limit(query)

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
            results = featured_fallback(results) if featured_true? && results.empty?
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

        companies_scope = companies_scope.limit(params[:limit].to_i) if limit_present?

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

          banners_scope = banners_scope.limit(params[:limit].to_i) if limit_present?

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
        products_scope = products_scope.limit(params[:limit].to_i) if limit_present?

        render json: products_scope.as_json(
          only: %i[id name description price company_id image_url]
        ), status: :ok
      end

      # =========================
      # POST /categories
      # =========================
      def create
        @category = Category.new(category_params)

        if @category.save
          render json: category_json(@category), status: :created
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # =========================
      # PUT/PATCH /categories/:id
      # =========================
      def update
        if @category.update(category_params)
          render json: category_json(@category), status: :ok
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
      # GET /categories/by_slug/:slug
      # (melhoria: rota dedicada a slug, sem “params[:id]”)
      # =========================
      def show_by_slug
        slug = params.require(:slug)
        @category = Category.find_by!(seo_url: slug)

        cache_key = "categories/slug/#{slug}/#{@category.updated_at.to_i}"

        cached_json(cache_key, expires_in: 1.hour) do
          @category.as_json
        end
      end

      private

      # -------------------------
      # Errors
      # -------------------------
      def record_not_found(e)
        Rails.logger.error("Category not found: #{e.message}")
        render json: { error: 'Categoria não encontrada' }, status: :not_found
      end

      def handle_standard_error(e)
        Rails.logger.error("Categories error: #{e.message}\n#{e.backtrace.take(5).join("\n")}")
        render json: { error: 'Erro interno no servidor', details: e.message }, status: :internal_server_error
      end

      # -------------------------
      # Finders / Params
      # -------------------------
      def set_category
        @category = Category.find(params[:id])
      end

      def category_params
        params.require(:category).permit(
          :name, :seo_url, :seo_title, :short_description,
          :description, :parent_id, :kind, :status, :featured
        )
      end

      # -------------------------
      # Helpers
      # -------------------------
      def category_json(category)
        category.as_json(only: CATEGORY_JSON_FIELDS)
      end

      def apply_category_filters(query)
        if Category.column_names.include?('status') && params[:status].present?
          query = query.where(status: params[:status])
        end

        if Category.column_names.include?('featured') && params[:featured].present?
          query = query.where(featured: featured_true?)
        end

        query
      end

      def apply_limit(query)
        return query unless limit_present?
        return query if params[:page].present? # mantém sua lógica: limit só quando não há paginação

        query.limit(params[:limit].to_i)
      end

      def limit_present?
        params[:limit].present? && params[:limit].to_i.positive?
      end

      def featured_true?
        params[:featured].present? && ActiveModel::Type::Boolean.new.cast(params[:featured])
      end

      def featured_fallback(_results)
        fallback = Category.all

        if Category.column_names.include?('status')
          fallback = fallback.where(status: params[:status].presence || 'active')
        end

        fallback = fallback.limit(params[:limit].to_i) if limit_present?
        fallback = fallback.includes(:companies) if Category.reflect_on_association(:companies)

        fallback.to_a
      end

      # Expire all category caches when data changes
      def expire_categories_cache
        expire_cache('categories')
        Rails.logger.info("🗑️  Expired all category caches")
      end

      # -------------------------
      # Cards View Mode
      # -------------------------
      def render_cards_view
        @categories = Category.where(status: 'active')

        # Filtros opcionais
        @categories = @categories.where(featured: true) if params[:featured] == 'true'
        
        # Ordenação (Destaques primeiro ou A-Z)
        @categories = @categories.order(featured: :desc, name: :asc)

        # Eager loading para evitar N+1
        @categories = @categories.includes(:banners, :companies, :products)

        # Paginação (se parâmetros fornecidos)
        if params[:page].present? || params[:per_page].present?
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 12
          per_page = [per_page, 50].min # Máximo 50 por página

          total = @categories.count
          @categories = @categories.offset((page - 1) * per_page).limit(per_page)

          # Mapeamento manual incluindo contadores
          data = @categories.map do |category|
            {
              id: category.id,
              name: category.name,
              seo_url: category.seo_url,
              seo_title: category.seo_title,
              short_description: category.short_description,
              featured: category.featured,
              banner_url: category.banners.find { |b| b.active }&.image_url,
              icon_url: category.icon.attached? ? Rails.application.routes.url_helpers.rails_blob_url(category.icon, only_path: false) : nil,
              companies_count: category.companies.size,
              products_count: category.products.size,
              reviews_count: category.companies.joins(:reviews).count
            }
          end

          # Retorna com metadata de paginação
          render json: {
            data: data,
            meta: {
              current_page: page,
              per_page: per_page,
              total_items: total,
              total_pages: (total.to_f / per_page).ceil
            }
          }
        else
          # Sem paginação - aplicar limite se fornecido
          @categories = @categories.limit(params[:limit]) if params[:limit].present?

          data = @categories.map do |category|
            {
              id: category.id,
              name: category.name,
              seo_url: category.seo_url,
              seo_title: category.seo_title,
              short_description: category.short_description,
              featured: category.featured,
              banner_url: category.banners.find { |b| b.active }&.image_url,
              icon_url: category.icon.attached? ? Rails.application.routes.url_helpers.rails_blob_url(category.icon, only_path: false) : nil,
              companies_count: category.companies.size,
              products_count: category.products.size,
              reviews_count: category.companies.joins(:reviews).count
            }
          end

          render json: data
        end
      end
    end
  end
end
