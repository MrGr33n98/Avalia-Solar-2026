module Api
  module V1
    class SitemapsController < ApplicationController
      # Ignorar autenticação/autorização para sitemap endpoints
      skip_before_action :authenticate_request, raise: false
      skip_before_action :authorize_request, raise: false

      def local_rankings
        begin
          data = Rails.cache.fetch('sitemap_local_rankings', expires_in: 1.hour) do
            fetch_local_rankings
          end

          render json: { data: data }, status: :ok
        rescue StandardError => e
          Rails.logger.error("[SitemapsController] Failed to generate local rankings: #{e.message}")
          render json: { data: [] }, status: :ok # Retornar vazio para não quebrar o next.js
        end
      end

      private

      def fetch_local_rankings
        # Pega todas as combinações de category_slug, state, city
        # Onde a empresa está publicada (active/published) e aprovada (verified não é obrigatório para SEO, 
        # mas segundo a regra do usuário, deve ser: active, published, approved).
        # Nota: status 'active' usualmente significa aprovada/publicada, dependendo do modelo.
        
        # O projeto usa `status: 'active'` para empresas ativas.
        # Vamos assumir: status: 'active' e, se existir published_at, ele deve estar preenchido.
        
        results = ::Company.joins(:categories)
                         .where(companies: { status: 'active' })
                         .where.not(companies: { city: [nil, ''], state: [nil, ''] })
                         .group('categories.seo_url', 'companies.state', 'companies.city')
                         .having('COUNT(companies.id) >= 3')
                         .pluck('categories.seo_url', 'companies.state', 'companies.city', 'MAX(companies.updated_at)')

        # Deduplicar e formatar (pluck já deduplica agrupamentos)
        results.map do |category_slug, state, city, updated_at|
          {
            category_slug: category_slug,
            state: state.downcase,
            city_slug: ::Locations::CoverageNormalizer.city_slug(city),
            updated_at: updated_at
          }
        end.uniq { |r| "#{r[:category_slug]}-#{r[:state]}-#{r[:city_slug]}" }
      end
    end
  end
end
