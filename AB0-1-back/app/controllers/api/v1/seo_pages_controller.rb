module Api
  module V1
    class SeoPagesController < ApplicationController
      skip_before_action :authenticate_user!, only: [:show]

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
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'SEO Page not found' }, status: :not_found
      end
    end
  end
end
