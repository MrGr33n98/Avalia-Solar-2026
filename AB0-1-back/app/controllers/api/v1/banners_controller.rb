class Api::V1::BannersController < ApplicationController
  # GET /api/v1/banners
  # Params:
  #   - position: string (optional) - Filter by position (e.g., 'categories_top')
  #   - limit: integer (optional) - Limit number of results
  def index
    # 1. Filtrar banners ativos e válidos por data
    @banners = Banner.where(active: true)
    
    # Validar datas se as colunas existirem
    if Banner.column_names.include?('start_date') && Banner.column_names.include?('end_date')
      @banners = @banners.where("start_date <= ? AND end_date >= ?", Time.current, Time.current)
    end

    # 2. Filtro por posição (ex: categories_top)
    if params[:position].present?
      @banners = @banners.where(position: params[:position])
    end

    # 3. Ordenação: Patrocinados primeiro, depois por data
    if Banner.column_names.include?('sponsored')
      @banners = @banners.order(sponsored: :desc, created_at: :desc)
    else
      @banners = @banners.order(created_at: :desc)
    end

    # 4. Aplicar limite se fornecido
    if params[:limit].present? && params[:limit].to_i.positive?
      @banners = @banners.limit(params[:limit].to_i)
    end

    render json: @banners.as_json(
      only: %i[id title link_url active position sponsored created_at],
      methods: :image_url
    )
  end
end
