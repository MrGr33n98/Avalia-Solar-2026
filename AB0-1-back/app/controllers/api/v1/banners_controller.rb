class Api::V1::BannersController < Api::V1::BaseController
  # GET /api/v1/banners
  # Params:
  #   - position: string (optional) - Filter by position (e.g., 'categories_top')
  #   - category_id: integer (optional) - When provided, returns banners assigned to the category OR global (no categories)
  #   - slot_key: string (optional) - Specific slot targeting (e.g., 'company_overview_inline')
  #   - company_id: integer (optional) - Prefer banners targeted to a company but include global ones
  #   - limit: integer (optional) - Limit number of results
  def index
    begin
      @banners = ::Banner.currently_active

      @banners = @banners.where(position: params[:position]) if params[:position].present?

      if params[:slot_key].present? && ::Banner.column_names.include?('slot_key')
        @banners = @banners.where(slot_key: params[:slot_key])
      end

      if params[:company_id].present? && ::Banner.column_names.include?('company_id')
        @banners = @banners.where('company_id = ? OR company_id IS NULL', params[:company_id])
      end

      if params[:category_id].present?
        if ::Banner.reflect_on_association(:categories) && ActiveRecord::Base.connection.table_exists?(:banners_categories)
          @banners = @banners.left_joins(:categories)
                             .where('categories.id = ? OR categories.id IS NULL', params[:category_id])
                             .distinct
        elsif ::Banner.column_names.include?('category_id')
          @banners = @banners.where(category_id: params[:category_id])
        end
      end

      if ::Banner.column_names.include?('sponsored')
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
    rescue StandardError
      render json: [], status: :ok
    end
  end
end
