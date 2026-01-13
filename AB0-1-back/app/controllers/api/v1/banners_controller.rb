class Api::V1::BannersController < ApplicationController
  # GET /api/v1/banners
  # Params:
  #   - position: string (optional) - Filter by position (e.g., 'categories_top')
  #   - category_id: integer (optional) - When provided, returns banners assigned to the category OR global (no categories)
  #   - limit: integer (optional) - Limit number of results
  def index
    @banners = Banner.currently_active

    @banners = @banners.where(position: params[:position]) if params[:position].present?

    if params[:category_id].present?
      if Banner.reflect_on_association(:categories)
        @banners = @banners.left_joins(:categories)
                           .where('categories.id = ? OR categories.id IS NULL', params[:category_id])
                           .distinct
      else
        @banners = @banners.where(category_id: params[:category_id])
      end
    end

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
      only: %i[id title link active position sponsored banner_type category_id company_id start_date end_date created_at width height],
      methods: %i[image_url link_url category_ids]
    )
  end
end
