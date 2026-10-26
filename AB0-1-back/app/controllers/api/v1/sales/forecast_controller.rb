module Api
  module V1
    module Sales
      class ForecastController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          report = ::Sales::Reporting::NutshellReportQuery.call(
            user: current_user,
            report_type: 'forecast',
            granularity: params[:granularity] || 'month',
            measure: 'value',
            from: params[:from],
            to: params[:to]
          )

          forecast = (report[:chart_data] || []).map do |item|
            {
              month: item[:date],
              pipeline_cents: item[:amount_cents],
              weighted_cents: item[:amount_cents] # Ou calculado ponderado
            }
          end

          render json: { forecast: forecast, summary: report[:summary] }
        end
      end
    end
  end
end
