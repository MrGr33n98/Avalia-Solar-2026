# frozen_string_literal: true

module Sales
  class CapturePipelineDailySnapshotJob < ApplicationJob
    queue_as :default

    def perform(date = nil)
      target_date = date.present? ? Date.parse(date.to_s) : Date.current
      captured_at = Time.current

      Rails.logger.info("[CapturePipelineDailySnapshotJob] Iniciando captura para #{target_date}")

      # Agrupa oportunidades abertas no momento da captura
      # Liga com sales_accounts para obter company_id do tenant
      grouped = ::Sales::Opportunity
                .open
                .left_joins(:sales_account)
                .group(
                  :sales_pipeline_id,
                  'sales_accounts.company_id',
                  :owner_id,
                  :source_id
                )
                .pluck(
                  :sales_pipeline_id,
                  'sales_accounts.company_id',
                  :owner_id,
                  :source_id,
                  Arel.sql('COUNT(*)'),
                  Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)')
                )

      persisted_count = 0

      ::ActiveRecord::Base.transaction do
        grouped.each do |pipeline_id, company_id, owner_id, source_id, count, value_cents|
          snapshot = ::Sales::PipelineDailySnapshot.find_or_initialize_by(
            sales_pipeline_id: pipeline_id,
            company_id: company_id,
            owner_id: owner_id,
            source_id: source_id,
            snapshot_date: target_date
          )

          snapshot.assign_attributes(
            open_count: count.to_i,
            open_value_cents: value_cents.to_i,
            currency: 'BRL',
            captured_at: captured_at,
            definition_version: 1
          )

          snapshot.save!
          persisted_count += 1
        end
      end

      Rails.logger.info("[CapturePipelineDailySnapshotJob] Captura concluída para #{target_date}: #{persisted_count} registros gerados/atualizados.")
      { status: 'success', date: target_date.to_s, snapshots_count: persisted_count }
    end

    def self.capture_today!
      new.perform(Date.current)
    end
  end
end
