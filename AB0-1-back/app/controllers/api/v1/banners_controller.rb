class Api::V1::BannersController < ApplicationController
  # GET /api/v1/banners
  # Params:
  #   - position: string (optional) - Filter by position (e.g., 'categories_top')
  #   - limit: integer (optional) - Limit number of results
  def index
    @banners = Banner.currently_active

    @banners = @banners.where(position: params[:position]) if params[:position].present?

    # Sponsored first, then newest
    if Banner.column_names.include?('sponsored')
      @banners = @banners.order(sponsored: :desc, created_at: :desc)
    else
      @banners = @banners.order(created_at: :desc)
    end

    if params[:limit].present? && params[:limit].to_i.positive?
      @banners = @banners.limit(params[:limit].to_i)
    end

    render json: @banners.as_json(
      only: %i[id title link active position sponsored banner_type category_id company_id start_date end_date created_at],
      methods: %i[image_url link_url]
    )
  end
end
