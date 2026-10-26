# frozen_string_literal: true

module Api
  module V1
    module Sales
      class NutshellReportsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          report = ::Sales::Reporting::NutshellReportQuery.call(
            user: current_user,
            report_type: params[:report_type] || 'sales',
            granularity: params[:granularity] || 'month',
            measure: params[:measure] || 'value',
            from: params[:from],
            to: params[:to],
            segment_by: params[:segment_by] || 'none'
          )

          render json: report
        end
      end
    end
  end
end
