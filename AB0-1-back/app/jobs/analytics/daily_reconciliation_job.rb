# frozen_string_literal: true

module Analytics
  class DailyReconciliationJob < ApplicationJob
    queue_as :default

    def perform(day = Date.yesterday)
      day = Date.parse(day) if day.is_a?(String)
      range = day.beginning_of_day..day.end_of_day

      # Processamos apenas empresas que tiveram atividade no dia
      company_ids = CompanyDailyStat.where(day: day).pluck(:company_id).uniq

      company_ids.each do |company_id|
        reconcile_metrics(company_id, day, range)
      end
    end

    private

    def reconcile_metrics(company_id, day, range)
      stats = CompanyDailyStat.find_by(company_id: company_id, day: day)
      return unless stats

      metrics = [
        {
          name: 'profile_views',
          canonical: stats.profile_views,
          observed: AnalyticsEvent.where(company_id: company_id, event_type: 'profile_view', tracked_at: range).count
        },
        {
          name: 'leads',
          canonical: stats.leads,
          observed: observed_platform_event_count(
            company_id: company_id,
            event_type: 'lead_created',
            range: range
          )
        }
      ]

      metrics.each do |m|
        save_reconciliation(company_id, day, m)
      end
    end

    def save_reconciliation(company_id, day, metric)
      canonical = metric[:canonical].to_i
      observed = metric[:observed].to_i
      delta_abs = (canonical - observed).abs

      # Evita divisão por zero
      delta_percent = if observed.positive?
                        (delta_abs.to_f / observed * 100).round(4)
                      else
                        canonical.positive? ? 100.0 : 0.0
                      end

      status = AnalyticsReconciliation.calculate_status(delta_percent)

      recon = AnalyticsReconciliation.find_or_initialize_by(
        company_id: company_id,
        day: day,
        metric_name: metric[:name]
      )

      recon.assign_attributes(
        canonical_value: canonical,
        observed_value: observed,
        delta_abs: delta_abs,
        delta_percent: delta_percent,
        status: status
      )

      recon.save!

      log_critical_discrepancy(recon) if status == 'critical'
    end

    def log_critical_discrepancy(recon)
      Rails.logger.error(
        '[AnalyticsReconciliation][CRITICAL] Discrepancy detected! ' \
        "Company: #{recon.company_id}, Day: #{recon.day}, Metric: #{recon.metric_name}, " \
        "Canonical: #{recon.canonical_value}, Observed: #{recon.observed_value}, " \
        "Delta: #{recon.delta_percent}%"
      )

      # Alerta operacional crítico
      SlackNotificationService.notify_reconciliation_alert(recon)
    end

    def observed_platform_event_count(company_id:, event_type:, range:)
      connection = ActiveRecord::Base.connection
      return 0 unless connection.table_exists?('platform_events')

      sql = <<~SQL
        SELECT COUNT(*)
        FROM platform_events
        WHERE company_id = #{connection.quote(company_id)}
          AND event_type = #{connection.quote(event_type)}
          AND occurred_at >= #{connection.quote(range.begin)}
          AND occurred_at <= #{connection.quote(range.end)}
      SQL

      connection.select_value(sql).to_i
    end
  end
end
