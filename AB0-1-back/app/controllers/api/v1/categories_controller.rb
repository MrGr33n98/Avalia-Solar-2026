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
      before_action :set_category, only: %i[show update destroy companies products banners evaluation_context]

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
        return render_cards_view if params[:view] == 'cards'

        # MODO LEGADO: Mantém compatibilidade com código existente
        articles_ts = ::Article.maximum(:updated_at).to_i
        cache_key = "#{cache_key_for('categories', params.except(:page, :per_page))}/articles/#{articles_ts}"

        cached_json(cache_key, expires_in: 1.hour) do
          query = ::Category.all
          query = apply_category_filters(query)
          query = apply_limit(query)

          # Optimization: Eager load associations to avoid N+1 queries
          query = query.preload(
            :products,
            :banner_attachment, :banner_blob,
            :icon_attachment, :icon_blob,
            companies: %i[logo_attachment logo_blob]
          )

          articles_count_map = ::Article.published.group(:category_id).count

          if params[:page].present?
            paginated = paginate(query)
            set_pagination_headers(paginated)
            {
              data: paginated.map { |c| category_json(c, articles_count_map: articles_count_map) },
              meta: { pagination: pagination_metadata(paginated) }
            }
          else
            results = query.to_a
            results = featured_fallback(results) if featured_true? && results.empty?
            results.map { |c| category_json(c, articles_count_map: articles_count_map) }
          end
        end
      end

      # =========================
      # GET /categories/:id
      # =========================
      def show
        @category.increment!(:views_count)
        cache_key = "categories/show/#{@category.id}/#{@category.updated_at.to_i}"

        cached_json(cache_key, expires_in: 1.hour) do
          category_json(@category)
        end
      end

      # =========================
      # GET /categories/:id/companies
      # =========================
      def companies
        Rails.logger.info("🔎 [CategoriesController#companies] Fetching companies for Category ##{@category.id} (#{@category.name})")

        companies_scope = @category.companies

        # Filtros de Status
        if params[:status].present? && ::Company.column_names.include?('status')
          companies_scope = companies_scope.where(status: params[:status])
        end

        # Filtro de Busca (Search Term)
        if params[:searchTerm].present?
          term = "%#{params[:searchTerm].downcase}%"
          companies_scope = companies_scope.where('LOWER(name) LIKE ? OR LOWER(description) LIKE ?', term, term)
        end

        # Filtro de Estado
        companies_scope = companies_scope.where(state: params[:state]) if params[:state].present?

        # Filtro de Cidade
        companies_scope = companies_scope.where(city: params[:city]) if params[:city].present?

        # Filtro de Avaliação (Rating)
        if params[:rating].present? && params[:rating].to_f.positive?
          # Assumindo que temos rating_avg ou similar. Se não tiver, ignoramos por enquanto.
          if ::Company.column_names.include?('rating_avg')
            companies_scope = companies_scope.where('rating_avg >= ?', params[:rating].to_f)
          elsif ::Company.column_names.include?('average_rating')
            companies_scope = companies_scope.where('average_rating >= ?', params[:rating].to_f)
          end
        end

                  # Filtro de Verificadas
                  if params[:verified] == 'true' && ::Company.column_names.include?('verified')
                    companies_scope = companies_scope.where(verified: true)
                  end
        
                  # Filtro de Nicho (Tags) - US13
                  if params[:niche_tag].present? && ::Company.column_names.include?('niche_tags')
                    # Busca se o array jsonb contém a tag
                    companies_scope = companies_scope.where("niche_tags @> ?", [params[:niche_tag]].to_json)
                  end
        # Log count before limit/pagination
        total_count = companies_scope.count
        Rails.logger.info("✅ [CategoriesController#companies] Found #{total_count} companies (before limit/pagination)")

        # Paginação
        if params[:page].present?
          companies_scope = paginate(companies_scope)
          set_pagination_headers(companies_scope)

          # Optimization: Eager load associations
          companies_scope = companies_scope.includes(logo_attachment: :blob, banner_attachment: :blob)

          render json: {
            companies: companies_scope.map { |c| ::CompanySerializer.new(c).as_json },
            meta: pagination_metadata(companies_scope)
          }, status: :ok
        else
          companies_scope = companies_scope.limit(params[:limit].to_i) if limit_present?

          # Optimization: Eager load associations
          companies_scope = companies_scope.includes(logo_attachment: :blob, banner_attachment: :blob)

          render json: companies_scope.map { |c| ::CompanySerializer.new(c).as_json }, status: :ok
        end
      end

      # =========================
      # GET /categories/:id/banners
      # =========================
      def banners
        banners_scope = ::Banner.currently_active

        if ::Banner.reflect_on_association(:categories)
          # Includes banners targeted to this category + global banners (no categories selected)
          banners_scope = banners_scope.left_joins(:categories)
                                       .where('categories.id = ? OR categories.id IS NULL', @category.id)
                                       .distinct
        else
          banners_scope = banners_scope.where(category_id: @category.id)
        end

        banners_scope = banners_scope.where(position: params[:position]) if params[:position].present?
        banners_scope = banners_scope.limit(params[:limit].to_i) if limit_present?

        max_updated_at = banners_scope.maximum(:updated_at).to_i
        cache_key = "categories/#{@category.id}/banners/#{max_updated_at}"

        cached_json(cache_key, expires_in: 30.minutes) do
          banners_scope.map do |banner|
            {
              id: banner.id,
              title: banner.title,
              link: banner.link,
              banner_type: banner.banner_type,
              position: banner.position,
              width: banner.width,
              height: banner.height,
              image_url: banner.try(:image_url),
              category_ids: banner.try(:category_ids) || []
            }
          end
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
      # GET /categories/:id/evaluation_context
      # =========================
      def evaluation_context
        criteria_ts = RatingCriterion.active.maximum(:updated_at).to_i
        cache_key = "categories/#{@category.id}/evaluation_context/#{@category.updated_at.to_i}/#{criteria_ts}"

        cached_json(cache_key, expires_in: 12.hours) do
          criteria = @category.effective_rating_criteria
          {
            category_id: @category.id,
            category_name: @category.name,
            has_granular_criteria: criteria.any?,
            total_criteria: criteria.size,
            criteria: criteria.map { |rc| serialize_criterion(rc) }
          }
        end
      end

      private

      def serialize_criterion(rc)
        {
          id: rc.id,
          slug: rc.slug,
          title: rc.title,
          help_text: rc.help_text,
          required: rc.required,
          allow_na: rc.allow_na,
          weight: rc.weight.to_f,
          position: rc.position
        }
      end

      # =========================
      # POST /categories
      # =========================
      def create
        @category = ::Category.new(category_params)

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
        @category = ::Category.find_by!(seo_url: slug)
        @category.increment!(:views_count)

        cache_key = "categories/slug/#{slug}/#{@category.updated_at.to_i}"

        cached_json(cache_key, expires_in: 1.hour) do
          category_json(@category)
        end
      end

      # =========================
      # GET /categories/tree
      # =========================
      def tree
        begin
          last_update = ::Category.where(status: 'active').maximum(:updated_at).to_i
          cache_key = "api/v1/categories/tree/#{last_update}"

          # Usando cache mas com fallback imediato
          data = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
            roots = ::Category.where(status: 'active', parent_id: nil)
                              .order(:name)
                              .includes(:icon_attachment, children: :icon_attachment)

            roots.map { |root| category_tree_json(root) }
          end

          render json: data || []
        rescue StandardError => e
          Rails.logger.error("[CategoriesController#tree] Error: #{e.message}")
          render json: []
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

      def category_tree_json(category, visited = Set.new)
        return nil if visited.include?(category.id)
        visited.add(category.id)

        {
          id: category.id,
          name: category.name,
          slug: category.seo_url, # Mantendo seo_url mas garantindo que o frontend leia corretamente
          icon_url: category.icon_url,
          companies_count: category.companies_count || 0,
          children: (category.children.select { |c| c.status == 'active' } || [])
                    .sort_by(&:name)
                    .map { |child| category_tree_json(child, visited.dup) }
                    .compact
        }
      end

      def set_category
        @category = ::Category.find(params[:id])
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
      def category_json(category, articles_count_map: nil)
        ActiveModelSerializers::Adapter.create(
          CategorySerializer.new(category, articles_count_map: articles_count_map)
        ).as_json
      end

      def apply_category_filters(query)
        if ::Category.column_names.include?('status') && params[:status].present?
          query = query.where(status: params[:status])
        end

        if ::Category.column_names.include?('featured') && params[:featured].present?
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
        fallback = ::Category.all

        if ::Category.column_names.include?('status')
          fallback = fallback.where(status: params[:status].presence || 'active')
        end

        fallback = fallback.limit(params[:limit].to_i) if limit_present?

        # Optimization: Eager load associations to avoid N+1 queries in fallback
        includes_list = []
        includes_list << :products if ::Category.reflect_on_association(:products)
        includes_list << :banner_attachment if ::Category.reflect_on_association(:banner_attachment)
        includes_list << :icon_attachment if ::Category.reflect_on_association(:icon_attachment)

        if ::Category.reflect_on_association(:companies)
          includes_list << if ::Company.reflect_on_association(:logo_attachment)
                             { companies: :logo_attachment }
                           else
                             :companies
                           end
        end

        fallback = fallback.includes(includes_list) if includes_list.any?

        fallback.to_a
      end

      # Expire all category caches when data changes
      def expire_categories_cache
        expire_cache('categories')
        Rails.logger.info('🗑️  Expired all category caches')
      end

      # -------------------------
      # Cards View Mode
      # -------------------------
      def render_cards_view
        @categories = ::Category.where(status: 'active')

        # Filtros opcionais
        @categories = @categories.where(featured: true) if featured_true?
        @categories = @categories.by_region(params[:region]) if params[:region].present?
        @categories = @categories.by_min_rating(params[:min_rating]) if params[:min_rating].present?
        @categories = @categories.by_max_price(params[:max_price]) if params[:max_price].present?
        @categories = @categories.where(kind: params[:kind]) if params[:kind].present?

        # Busca textual
        if params[:search].present?
          term = "%#{params[:search].downcase}%"
          @categories = @categories.where('LOWER(name) LIKE ? OR LOWER(short_description) LIKE ?', term, term)
        end

        # Ordenação (Destaques primeiro ou A-Z)
        @categories = case params[:sort_by]
                      when 'rating_desc'
                        @categories.order(average_rating: :desc)
                      when 'views_desc'
                        @categories.order(views_count: :desc)
                      when 'price_desc'
                        @categories.order(average_price: :desc)
                      when 'name_asc'
                        @categories.order(name: :asc)
                      when 'companies_count_desc'
                        @categories.order(companies_count: :desc)
                      else
                        @categories.order(featured: :desc, name: :asc)
                      end

        # Otimização: removemos includes de companies/products pois usamos counter columns
        @categories = @categories.includes(banner_attachment: :blob, icon_attachment: :blob)
        articles_count_map = ::Article.published.group(:category_id).count

        # Paginação (se parâmetros fornecidos)
        if params[:page].present? || params[:per_page].present?
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 12
          per_page = [per_page, 50].min # Máximo 50 por página

          total = @categories.count
          @categories = @categories.offset((page - 1) * per_page).limit(per_page)

          # Mapeamento manual otimizado
          data = map_categories_data(@categories, articles_count_map)

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
          @categories = @categories.limit(params[:limit].to_i) if limit_present?
          data = map_categories_data(@categories, articles_count_map)
          render json: data
        end
      end

      def map_categories_data(categories, articles_count_map = {})
        categories.map do |category|
          {
            id: category.id,
            name: category.name,
            seo_url: category.seo_url,
            seo_title: category.seo_title,
            short_description: category.short_description,
            featured: category.featured,
            banner_url: category.banner_url,
            icon_url: category.icon_url,
            articles_count: articles_count_map[category.id].to_i,
            # Usando colunas cacheadas para performance O(1)
            companies_count: (category.respond_to?(:companies_count) ? category.companies_count : 0).to_i,
            products_count: (category.respond_to?(:products_count) ? category.products_count : 0).to_i,
            average_rating: (category.respond_to?(:average_rating) ? category.average_rating : 0.0).to_f,
            average_price: (category.respond_to?(:average_price) ? category.average_price : 0.0).to_f,
            views_count: (category.respond_to?(:views_count) ? category.views_count : 0).to_i,
            tags: category.tags
          }
        end
      end
    end
  end
end
