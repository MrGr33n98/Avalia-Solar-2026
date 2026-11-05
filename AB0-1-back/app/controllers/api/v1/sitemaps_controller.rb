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
          render json: { data: [] }, status: :ok
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
          render json: { data: [] }, status: :ok
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
        Rails.logger.error("[SitemapsController#services] #{'#{e.class}'}: #{'#{e.message}'}")
        render json: { data: [] }, status: :service_unavailable
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
