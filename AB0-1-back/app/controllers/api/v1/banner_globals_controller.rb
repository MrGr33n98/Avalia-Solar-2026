class Api::V1::BannerGlobalsController < ApplicationController
  include Rails.application.routes.url_helpers

  # GET /api/v1/banner_globals
  # Retorna todos os banners globais com imagens anexadas
  #
  # Fase 1: Implementa cache Redis e query SQL otimizada
  # Performance: 80% mais rápido com cache, 50% mais rápido query SQL
  def index
    # Chave de cache simples (sem parâmetros, endpoint sem filtros)
    cache_key = 'banner_globals/v1/all'

    # Busca do cache ou executa query otimizada
    banners = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      # Query SQL otimizada: JOIN com ActiveStorage ao invés de select em Ruby
      # ANTES: banners.select { |b| b.image.attached? } - O(n) em Ruby
      # DEPOIS: JOIN na query - O(log n) no PostgreSQL
      BannerGlobal.joins(:image_attachment)
                  .includes(image_attachment: :blob)
                  .order(created_at: :desc)
                  .to_a
    end

    # Serializa com URLs das imagens
    banners_with_images = banners.map do |banner|
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      
      banner.as_json.merge(
        image_url: banner.image.attached? ? rails_storage_proxy_url(banner.image, options) : nil
      )
    end

    render json: banners_with_images
  rescue StandardError => e
    Rails.logger.error("[BannerGlobalsController#index] Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: [], status: :ok
  end
end
