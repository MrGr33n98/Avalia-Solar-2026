# frozen_string_literal: true

module Api
  module V1
    module Sales
      class WidgetEngagementReportsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          report = ::Sales::Reporting::WidgetEngagementReportQuery.call(
            user: current_user,
            from: params[:from],
            to: params[:to],
            granularity: params[:granularity] || 'day'
          )

          render json: report
        end
      end
    end
  end
end
