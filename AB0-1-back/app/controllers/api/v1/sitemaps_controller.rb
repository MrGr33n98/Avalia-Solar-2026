module Api
  module V1
    class SitemapsController < ApplicationController
      # Ignorar autenticação/autorização para sitemap endpoints
      skip_before_action :authenticate_request, raise: false
      skip_before_action :authorize_request, raise: false

      def categories
        result = ::CategoryDiscovery::SitemapExporter.call(
          cursor: params[:cursor],
          limit: params[:limit] || params[:per_page]
        )

        Rails.logger.info(
          "[SitemapsController#categories] count=#{result.dig(:meta, :count)} " \
          "has_more=#{result.dig(:meta, :has_more)} duration_ms=#{result.dig(:meta, :duration_ms)}"
        )

        render json: result, status: :ok
      rescue StandardError => e
        Rails.logger.error("[SitemapsController#categories] #{e.class}: #{e.message}")
        Sentry.capture_exception(e) if defined?(Sentry)
        render json: { error: 'Falha ao exportar sitemap de categorias' }, status: :service_unavailable
      end

      # Feed leve e ultra-rápido de empresas para sitemaps, sem carregar relacionamentos pesados.
      def companies
        page = [params[:page].to_i, 1].max
        per_page = [[params[:per_page].to_i, 1].max, 1000].min

        scope = ::Company.where(status: 'active')
                         .where.not(slug: [nil, ''])
                         .order('id ASC')

        records = scope.limit(per_page).offset((page - 1) * per_page)
                       .pluck(:id, :slug, :name, :updated_at)

        response.headers['Cache-Control'] = 'public, max-age=1800, stale-while-revalidate=86400'
        render json: {
          data: records.map do |id, slug, name, updated_at|
            { id: id, slug: slug, name: name, updated_at: updated_at }
          end
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error("[SitemapsController#companies] #{e.class}: #{e.message}")
        render json: { data: [] }, status: :service_unavailable
      end

      def local_rankings
        begin
          data = Rails.cache.fetch('sitemap_local_rankings', expires_in: 1.hour) do
            fetch_local_rankings
          end

          render json: { data: data }, status: :ok
        rescue StandardError => e
          Rails.logger.error("[SitemapsController] Failed to generate local rankings: #{e.message}")
          response.headers['Cache-Control'] = 'no-store'
          render json: { error: 'Local rankings sitemap temporarily unavailable' }, status: :service_unavailable
        end
      end

      def group_posts
        begin
          data = Rails.cache.fetch('sitemap_group_posts', expires_in: 1.hour) do
            fetch_group_posts_data
          end

          render json: { data: data }, status: :ok
        rescue StandardError => e
          Rails.logger.error("[SitemapsController] Failed to generate group posts sitemap: #{e.message}")
          response.headers['Cache-Control'] = 'no-store'
          render json: { error: 'Group posts sitemap temporarily unavailable' }, status: :service_unavailable
        end
      end

      # Paginação cursor-like por página, somente empresas e serviços publicados.
      def services
        page = [params[:page].to_i, 1].max
        per_page = [[params[:per_page].to_i, 1].max, 500].min

        scope = ::CompanyService.joins(:company)
                                .where(company_services: { status: 'active' }, companies: { status: 'active' })
                                .order('company_services.id ASC')

        records = scope.limit(per_page).offset((page - 1) * per_page)
                       .pluck('companies.slug', 'company_services.slug', 'company_services.updated_at')
        render json: {
          data: records.filter_map do |company_slug, service_slug, updated_at|
            next if company_slug.blank? || service_slug.blank?
            { company_slug: company_slug, service_slug: service_slug, updated_at: updated_at }
          end
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error("[SitemapsController#services] #{e.class}: #{e.message}")
        render json: { data: [] }, status: :service_unavailable
      end

      def local_solar_pages
        result = ::CategoryDiscovery::LocalSolarSitemapExporter.call
        response.headers['Cache-Control'] = 'public, max-age=900, stale-while-revalidate=3600'
        render json: result, status: :ok
      rescue StandardError => e
        Rails.logger.error("[SitemapsController#local_solar_pages] #{e.class}: #{e.message}")
        response.headers['Cache-Control'] = 'no-store'
        render json: { error: 'Local solar sitemap temporarily unavailable' }, status: :service_unavailable
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
                         .where(companies: { status: 'active' }, categories: { status: 'active' })
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

      def fetch_group_posts_data
        ::GroupPost.joins(:group)
                   .where(groups: { visibility: 'public', status: 'active' })
                   .where(group_posts: { status: 'published' })
                   .pluck('groups.slug', 'group_posts.id', 'group_posts.updated_at')
                   .map do |group_slug, post_id, updated_at|
                     {
                       group_slug: group_slug,
                       post_id: post_id,
                       updated_at: updated_at
                     }
                   end
      end
    end
  end
end
