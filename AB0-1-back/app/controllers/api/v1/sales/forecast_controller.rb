module Api
  module V1
    module Sales
      class ForecastController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          opportunities = ::Sales::TenantScope.for(current_user).opportunities.open

          from_date = params[:from].presence || Date.current
          opportunities = opportunities.where('expected_close_date >= ?', from_date)
          opportunities = opportunities.where('expected_close_date <= ?', params[:to]) if params[:to].present?
          opportunities = opportunities.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          opportunities = opportunities.where(sales_pipeline_id: params[:pipeline_id]) if params[:pipeline_id].present?
          opportunities = opportunities.where(sales_stage_id: params[:stage_id]) if params[:stage_id].present?

          grouped = opportunities
                    .group("DATE_TRUNC('month', expected_close_date)")
                    .order("DATE_TRUNC('month', expected_close_date)")
                    .pluck(
                      Arel.sql("DATE_TRUNC('month', expected_close_date)::date AS month"),
                      Arel.sql('COALESCE(SUM(value_cents), 0)::bigint AS pipeline_cents'),
                      Arel.sql('COALESCE(SUM(value_cents * COALESCE(probability, 0) / 100.0), 0)::bigint AS weighted_cents')
                    )

          forecast = grouped.map do |month, pipe_cents, weight_cents|
            {
              month: month,
              pipeline_cents: pipe_cents.to_i,
              weighted_cents: weight_cents.to_i
            }
          end

          render json: { forecast: forecast }
        end
      end
    end
  end
end
