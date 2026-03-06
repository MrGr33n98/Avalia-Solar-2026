module Api
  module V1
    class SeoPagesController < Api::V1::BaseController
      # Permite acesso público às páginas de SEO
      def show
        @seo_page = SeoLandingPage.find_by_slug!(params[:slug])
        
        render json: {
          slug: @seo_page.slug,
          city_name: @seo_page.city_name,
          state_abbr: @seo_page.state_abbr,
          metadata_cache: @seo_page.metadata_cache,
          category: {
            id: @seo_page.category.id,
            name: @seo_page.category.name,
            seo_url: @seo_page.category.seo_url,
            description: @seo_page.category.description
          }
        }
      end
    end
  end
end
