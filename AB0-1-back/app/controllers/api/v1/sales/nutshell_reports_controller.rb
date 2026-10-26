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
            segment_by: params[:segment_by] || 'none',
            filters: filter_params
          )

          render json: report
        end

        private

        def filter_params
          params.permit(
            :pipeline_id, :stage_id, :stage_id_not,
            :value_min, :value_max,
            :age_min_days, :age_max_days, :last_contacted_days,
            :close_from, :close_to,
            owner_ids: [], owner_ids_not: [],
            source_ids: [], source_ids_not: [],
            tag_ids: [], tag_ids_not: [],
            competitor_ids: [], competitor_ids_not: [],
            account_ids: [], account_ids_not: [],
            status_in: [], status_not: [],
            states: []
          ).to_h
        end
      end
    end
  end
end
