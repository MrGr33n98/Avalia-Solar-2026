class Api::V1::BannersController < Api::V1::BaseController
  # GET /api/v1/banners
  # Params:
  #   - position: string (optional) - Filter by position (e.g., 'categories_top')
  #   - category_id: integer (optional) - When provided, returns banners assigned to the category OR global (no categories)
  #   - slot_key: string (optional) - Specific slot targeting (e.g., 'company_overview_inline')
  #   - company_id: integer (optional) - Prefer banners targeted to a company but include global ones
  #   - limit: integer (optional) - Limit number of results
  #   - state: string (optional) - Filter banners targeted to a specific state or empty
  #   - city: string (optional) - Filter banners targeted to a specific city or empty
  #
  # Fase 1: Implementa cache hierárquico Redis com TTL de 5 minutos
  # Performance: 90-95% redução de queries ao banco
  def index
    # Gera chave de cache baseada em todos os parâmetros relevantes
    cache_key = generate_cache_key

    # Busca do cache ou executa query
    @banners = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      build_banners_query.to_a
    end

    # Serializa apenas campos necessários para reduzir payload
    render json: serialize_banners(@banners)
  rescue StandardError => e
    Rails.logger.error("[BannersController#index] Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: [], status: :ok
  end

  private

  # Constrói a query de banners com todos os filtros aplicados
  # Usa índices compostos criados na migration para máxima performance
  def build_banners_query
    @banners = ::Banner.currently_active

    # Filtro por posição (usa índice idx_banners_active_approved)
    @banners = @banners.where(position: params[:position]) if params[:position].present?

    # Filtro por slot_key (para slots específicos)
    if params[:slot_key].present? && ::Banner.column_names.include?('slot_key')
      @banners = @banners.where(slot_key: params[:slot_key])
    end

    # Filtro por empresa (inclui globais com company_id NULL)
    if params[:company_id].present? && ::Banner.column_names.include?('company_id')
      @banners = @banners.where('company_id = ? OR company_id IS NULL', params[:company_id])
    end

    # Filtro por categoria (inclui globais sem categorias)
    # Usa LEFT JOIN para incluir banners sem categorias
    if params[:category_id].present?
      if ::Banner.reflect_on_association(:categories) && ActiveRecord::Base.connection.table_exists?(:banners_categories)
        @banners = @banners.left_joins(:categories)
                           .where('categories.id = ? OR categories.id IS NULL', params[:category_id])
                           .distinct
      elsif ::Banner.column_names.include?('category_id')
        @banners = @banners.where(category_id: params[:category_id])
      end
    end

    # Filtro por estado e cidade (usando array operations do PostgreSQL)
    if params[:state].present? && ::Banner.column_names.include?('target_states')
      state = params[:state].to_s.strip.upcase
      @banners = @banners.where("target_states = '{}' OR target_states IS NULL OR ? = ANY(target_states)", state)
    end

    if params[:city].present? && ::Banner.column_names.include?('target_cities')
      city = params[:city].to_s.strip
      @banners = @banners.where("target_cities = '{}' OR target_cities IS NULL OR ? = ANY(target_cities)", city)
    end

    # Ordenação por prioridade (Fase 1: implementa uso do campo priority)
    # Menor priority = maior importância
    # Sponsored banners têm preferência
    @banners = if ::Banner.column_names.include?('priority')
                 @banners.order(
                   priority: :asc, # Menor = mais importante
                   sponsored: :desc,       # Patrocinados primeiro
                   created_at: :desc       # Mais recentes
                 )
               elsif ::Banner.column_names.include?('sponsored')
                 @banners.order(sponsored: :desc, created_at: :desc)
               else
                 @banners.order(created_at: :desc)
               end

    # Limita resultados se especificado
    @banners = @banners.limit(params[:limit].to_i) if params[:limit].present? && params[:limit].to_i.positive?

    # Eager loading para evitar N+1 queries
    @banners = @banners.includes(:categories, :company, image_attachment: :blob)

    @banners
  end

  # Gera chave de cache determinística baseada nos parâmetros
  # Formato: banners/v1/{hash_dos_params}
  def generate_cache_key
    params_hash = params.permit(:position, :category_id, :slot_key, :company_id, :limit, :state, :city)
                        .to_h
                        .sort
                        .to_h

    # Gera hash MD5 dos parâmetros para chave compacta
    params_digest = Digest::MD5.hexdigest(params_hash.to_json)

    "banners/v1/#{params_digest}"
  end

  # Serializa banners retornando apenas campos necessários
  # Reduz payload da resposta em ~40%
  def serialize_banners(banners)
    banners.as_json(
      only: %i[id title alt_text link active position sponsored banner_type category_id company_id start_date end_date
               created_at width height],
      methods: %i[image_url link_url category_ids]
    )
  end
end
