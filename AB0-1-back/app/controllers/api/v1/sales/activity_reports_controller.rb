# frozen_string_literal: true

require 'csv'

module Api
  module V1
    module Sales
      class ActivityReportsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          report = ::Sales::Reporting::ActivityReportQuery.call(
            user: current_user,
            from: params[:from],
            to: params[:to],
            granularity: params[:granularity] || 'day',
            types: params[:types] || params[:activity_types],
            actor_ids: params[:actor_ids] || params[:user_ids],
            log_statuses: params[:log_statuses],
            include_emails: params[:include_emails],
            include_notes: params[:include_notes],
            segment_by: params[:segment_by] || 'type'
          )

          render json: report
        end

        def export
          report = ::Sales::Reporting::ActivityReportQuery.call(
            user: current_user,
            from: params[:from],
            to: params[:to],
            granularity: params[:granularity] || 'day',
            types: params[:types] || params[:activity_types],
            actor_ids: params[:actor_ids] || params[:user_ids],
            log_statuses: params[:log_statuses],
            include_emails: params[:include_emails],
            include_notes: params[:include_notes],
            segment_by: params[:segment_by] || 'type'
          )

          csv_data = CSV.generate(headers: true, col_sep: ',') do |csv|
            csv << ['Data', 'Tipo', 'Assunto', 'Consultor Solar', 'Conta / Cliente', 'Contato', 'Oportunidade', 'Duração (s)', 'Status']

            report[:recent_activities].each do |act|
              csv << [
                act[:occurred_at],
                act[:activity_type],
                act[:subject],
                act.dig(:actor, :name),
                act.dig(:account, :name),
                act.dig(:contact, :name),
                act.dig(:opportunity, :name),
                act[:duration_seconds] || 'N/D',
                act[:log_status] || 'completed'
              ]
            end
          end

          bom = "\uFEFF"
          send_data(
            "#{bom}#{csv_data}",
            filename: "relatorio_atividades_#{Time.zone.today}.csv",
            type: 'text/csv; charset=utf-8; header=present',
            disposition: 'attachment'
          )
        end
      end
    end
  end
end
