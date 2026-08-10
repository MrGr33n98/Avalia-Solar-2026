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
    Banners::Metrics.delivery(status: 'success', position: params[:position].presence || 'all', source: 'cache_or_db')
    render json: serialize_banners(@banners)
  rescue StandardError => e
    Rails.logger.error("[BannersController#index] Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    Banners::Metrics.delivery(status: 'error', position: params[:position].presence || 'unknown', source: 'fallback')
    render json: [], status: :ok
  end

  private

  # Constrói a query de banners com todos os filtros aplicados
  # Usa índices compostos criados na migration para máxima performance
  def build_banners_query
    Banners::BannerDeliveryQuery.call(params)
  end

  # Gera chave de cache determinística baseada nos parâmetros
  def generate_cache_key
    params_hash = params.permit(:position, :category_id, :slot_key, :company_id, :limit, :state, :city, :audience_key, :frequency_cap_seconds, :rotation_window_seconds)
                        .to_h
                        .sort
                        .to_h

    # Obtém as versões de cache granular
    versions = Banners::CacheInvalidatorService.current_versions(params_hash)
    version_string = versions.map { |k, v| "#{k}:#{v}" }.join('|')

    # Gera hash MD5 dos parâmetros para chave compacta
    params_digest = Digest::MD5.hexdigest(params_hash.to_json)

    "banners/v2/#{params_digest}/#{version_string}"
  end

  # Serializa banners retornando apenas campos necessários e anexa UTMs
  def serialize_banners(banners)
    serialized = banners.as_json(
      only: %i[id title alt_text link active position sponsored banner_type category_id company_id start_date end_date
               created_at width height],
      methods: %i[image_url link_url category_ids]
    )

    serialized.each do |b|
      b['delivery_id'] = Digest::SHA256.hexdigest("#{b['id']}:#{request.path}:#{request.query_parameters.to_query}")[0, 32]
      base_url = b['link_url'].presence || b['link'].presence
      next if base_url.blank?

      begin
        uri = URI.parse(base_url)
        
        # Ignorar URLs vazias ou esquemas muito inválidos
        next if uri.host.blank? && !base_url.start_with?('/')

        existing_query = URI.decode_www_form(uri.query || '')
        
        # Só injetar se ainda não tiver utm_source, para não sobrescrever tracking manual do cliente
        unless existing_query.assoc('utm_source')
          existing_query << ['utm_source', 'avaliasolar_ads']
          existing_query << ['utm_campaign', "banner_#{b['id']}"]
          uri.query = URI.encode_www_form(existing_query)
          
          b['link_url'] = uri.to_s
          b['link'] = uri.to_s
        end
      rescue StandardError
        # Ignorar erros de parse (ex: links javascript: ou mailto:)
      end
    end

    serialized
  end
end
