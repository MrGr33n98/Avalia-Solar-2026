# frozen_string_literal: true

# TASK-009: Yabeda Metrics Configuration
# Configures application metrics collection and Prometheus export

# Auto-configure Yabeda with Rails defaults
Yabeda.configure do
  # Custom metrics
  group :ab0 do
    # Business Metrics
    counter :donations_created,
            tags: [:status],
            comment: 'Total number of donations created'
    
    counter :users_registered,
            tags: [:role],
            comment: 'Total number of users registered'
    
    counter :notifications_sent,
            tags: [:type, :status],
            comment: 'Total number of notifications sent'

    counter :analytics_events_total,
            tags: [:event_type],
            comment: 'Total number of analytics events persisted'

    counter :company_views_total,
            tags: [:company_id],
            comment: 'Total number of company profile views'

    counter :company_access_context_requests_total,
            tags: [:status],
            comment: 'Total number of company access context requests by status'

    counter :banner_deliveries_total,
            tags: [:status, :position, :source],
            comment: 'Total de respostas de distribuição de banners'

    counter :banner_events_total,
            tags: [:event_type, :status, :quality, :discard_reason],
            comment: 'Total de eventos de banners recebidos e classificados'

    counter :banner_attributions_total,
            tags: [:status],
            comment: 'Total de atribuições de leads a banners'

    counter :banner_reconciliation_total,
            tags: [:status, :metric],
            comment: 'Total de verificações de consistência dos agregados de banners'

    gauge :banner_operational_health_discard_rate,
          tags: [:source],
          comment: 'Taxa percentual de eventos de banners descartados nas últimas 24h'

    gauge :banner_operational_health_lag_minutes,
          tags: [:source],
          comment: 'Atraso em minutos do agregado diário de banners'

    gauge :banner_audit_retention_candidates,
          comment: 'Quantidade de logs de auditoria de banners além da janela de retenção'

    gauge :banner_audit_retention_oldest_age_days,
          comment: 'Idade em dias do log de auditoria de banner mais antigo elegível'

    histogram :banner_operational_health_duration,
              tags: [:source],
              unit: :seconds,
              buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
              comment: 'Duração do cálculo de saúde operacional de banners'
    
    # Performance Metrics
    histogram :request_duration,
              tags: [:controller, :action, :status],
              unit: :seconds,
              buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
              comment: 'HTTP request duration histogram'
    
    gauge :active_users,
          comment: 'Number of active users in the last 24 hours'
    
    gauge :pending_donations,
          comment: 'Number of pending donations'
    
    # Database Metrics
    gauge :database_connection_pool_size,
          comment: 'Size of the database connection pool'
    
    gauge :database_active_connections,
          comment: 'Number of active database connections'
  end
end

# Collect custom metrics periodically (every minute)
Yabeda.configure do
  # Update gauges every time they're collected
  collect do
    begin
      # Active users in last 24 hours
      if defined?(User)
        active_count = User.where('last_sign_in_at > ?', 24.hours.ago).count
        ab0_active_users.set({}, active_count)
      end
      
      # Pending donations
      if defined?(Donation)
        pending_count = Donation.where(status: 'pending').count
        ab0_pending_donations.set({}, pending_count)
      end
      
      # Database connection pool metrics
      if defined?(ActiveRecord::Base)
        pool = ActiveRecord::Base.connection_pool
        if pool
          ab0_database_connection_pool_size.set({}, pool.size)
          ab0_database_active_connections.set({}, pool.connections.size)
        end
      end
    rescue StandardError => e
      Rails.logger.warn "⚠️  Yabeda collection failed: #{e.message}"
    end
  end
end

# Rails auto-instrumentation is enabled by default with yabeda-rails
# This includes:
# - yabeda_rails_requests_total (counter)
# - yabeda_rails_request_duration_seconds (histogram)
# - yabeda_view_runtime_seconds (histogram)
# - yabeda_db_runtime_seconds (histogram)

# Sidekiq auto-instrumentation is enabled with yabeda-sidekiq
# This includes:
# - yabeda_sidekiq_jobs_executed_total (counter)
# - yabeda_sidekiq_job_runtime_seconds (histogram)
# - yabeda_sidekiq_jobs_enqueued_total (counter)

# Puma auto-instrumentation is enabled with yabeda-puma-plugin
# This includes:
# - yabeda_puma_workers (gauge)
# - yabeda_puma_booted_workers (gauge)
# - yabeda_puma_running_threads (gauge)
# - yabeda_puma_request_backlog (gauge)

Rails.application.config.after_initialize do
  Rails.logger.info '✅ Yabeda metrics initialized'
  Rails.logger.info '📊 Metrics available at /metrics endpoint'
end
