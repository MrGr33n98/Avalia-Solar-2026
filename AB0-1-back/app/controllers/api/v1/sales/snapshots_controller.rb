# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SnapshotsController < BaseController
        def index
          from_param = params[:from]
          to_param = params[:to]
          granularity = params[:granularity] || 'day'
          pipeline_id = params[:pipeline_id]
          owner_ids = params[:owner_ids] || params[:owner_id]

          # Validação básica de intervalo
          if from_param.present? && to_param.present?
            from_d = Date.parse(from_param.to_s) rescue nil
            to_d = Date.parse(to_param.to_s) rescue nil

            if from_d.nil? || to_d.nil?
              return render json: { error: 'Datas inválidas fornecidas.' }, status: :unprocessable_entity
            elsif from_d > to_d
              return render json: { error: 'Data inicial não pode ser superior à data final.' }, status: :unprocessable_entity
            end
          end

          pipeline_data = ::Sales::Reporting::PipelineSnapshotsQuery.call(
            user: current_user,
            from: from_param,
            to: to_param,
            pipeline_id: pipeline_id,
            owner_ids: owner_ids,
            granularity: granularity
          )

          win_rate_data = ::Sales::Reporting::WinRateHistoryQuery.call(
            user: current_user,
            from: from_param,
            to: to_param,
            pipeline_id: pipeline_id,
            owner_ids: owner_ids,
            granularity: granularity == 'day' ? 'week' : granularity
          )

          response_payload = {
            meta: {
              from: pipeline_data.dig(:meta, :from),
              to: pipeline_data.dig(:meta, :to),
              timezone: 'America/Sao_Paulo',
              granularity: granularity,
              currency: 'BRL',
              historical_coverage_from: pipeline_data.dig(:meta, :historical_coverage_from),
              coverage: pipeline_data.dig(:meta, :coverage),
              as_of: pipeline_data.dig(:meta, :as_of),
              definition_version: 1
            },
            pipeline: {
              summary: pipeline_data[:summary],
              series: pipeline_data[:series]
            },
            win_rate: {
              summary: win_rate_data[:summary],
              series: win_rate_data[:series]
            }
          }

          respond_to do |format|
            format.json { render json: response_payload }
            format.csv do
              send_data generate_csv(response_payload),
                        filename: "crm_snapshots_#{response_payload.dig(:meta, :from)}_#{response_payload.dig(:meta, :to)}.csv",
                        type: 'text/csv; charset=utf-8'
            end
          end
        end

        private

        def generate_csv(payload)
          require 'csv'

          CSV.generate(headers: true) do |csv|
            csv << ['Tipo', 'Data', 'Metrica 1 (Contagem/Ganhos)', 'Metrica 2 (Valor Centavos / Perdidos)', 'Taxa (%)']

            payload.dig(:pipeline, :series)&.each do |s|
              csv << ['Pipeline Size', s[:date], s[:open_count] || 'Sem dados', s[:open_value_cents] || 'Sem dados', '—']
            end

            payload.dig(:win_rate, :series)&.each do |w|
              csv << ['Win Rate', w[:date], w[:won_count], w[:lost_count], w[:win_rate_pct] ? "#{w[:win_rate_pct]}%" : '—']
            end
          end
        end
      end
    end
  end
end
