# frozen_string_literal: true

require 'uri'
require 'json'

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    GLOBAL_EVENTS = %w[page_view search landing_view web_vital].freeze
    INTERNAL_SYSTEM_EVENTS = %w[page_view search landing_view theme_changed theme_changed_dashboard web_vital performance_metric error_occurred].freeze
    
    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      # FEATURE FLAG & KILL SWITCH GLOBAL
      # Default is enabled. Explicit 'false' disables ingestion.
      # This keeps dashboard telemetry alive even when legacy GA4 env vars are absent.
      is_enabled = ENV['G4_ANALYTICS_ENABLED'] != 'false' || Rails.env.test?

      unless is_enabled
        Rails.logger.info("[G4-Analytics] Analytics disabled by flag G4_ANALYTICS_ENABLED=false")
        return Result.new(ok: true, error: 'analytics_disabled_by_flag')
      end

      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at, event_id: event_id).call
    rescue StandardError => e
      # Garantia final: NUNCA quebrar o chamador por erro de Analytics
      Rails.logger.error("[G4-Analytics] Critical Failure in Service: #{e.class} - #{e.message}")
      Result.new(ok: false, error: 'analytics_service_error')
    end

    def initialize(company_id:, event_type:, metadata: {}, user: nil, occurred_at: nil, event_id: nil, user_id: nil)
      @company_id = company_id
      @user = user || (user_id ? User.find_by(id: user_id) : nil)
      @event_type = event_type.to_s
      @metadata = metadata.is_a?(Hash) ? metadata.stringify_keys : {}
      @occurred_at = occurred_at.presence || Time.current
      @event_id = event_id || "evt_#{Time.current.to_i}_#{SecureRandom.hex(6)}"
    end

    def call
      return Result.new(ok: false, error: 'event_type missing') if @event_type.blank?

      if @company_id.blank? && GLOBAL_EVENTS.include?(normalized_event_type)
        return Result.new(ok: true, event: nil, error: 'global_event_without_company_skipped')
      end

      return Result.new(ok: false, error: 'company_id missing for event') if @company_id.blank?

      # Validação de contrato (P0)
      validation_result = validate_contract!
      unless validation_result[:ok]
        log_ingest_error(validation_result[:missing_keys])
        
        # Hard mode: Se G4_ANALYTICS_STRICT_MODE=true, bloqueia o evento
        if ENV['G4_ANALYTICS_STRICT_MODE'] == 'true'
          return Result.new(ok: false, error: "contract_violation: missing_keys=#{validation_result[:missing_keys].join(',')}")
        end
      end
      
      unless ensure_unique_event!
        return Result.new(ok: true, event: nil, error: 'duplicate_event')
      end

      persist_platform_event!
      event = persist_analytics_event!
      
      # Forward to PostHog for Product Analytics (Sprint 3)
      forward_to_posthog if ENV['POSTHOG_API_KEY'].present?

      # Sync Review Telemetry Cache (Solar Reviews 2.0)
      if @event_type.start_with?('review_')
        Reviews::TelemetryAggregator.call(@event_type, @metadata)
      end

      Result.new(ok: true, event: event)
    rescue StandardError => e
      Rails.logger.error("[G4-Analytics] TrackEventService error: #{e.class} #{e.message}")        
      Result.new(ok: false, error: 'analytics_processing_error')
    end

    private

    def validate_contract!
      registry = Analytics::EventRegistry.fetch(@event_type)
      return { ok: true } if registry.nil? # Se não definido, aceita qualquer coisa (Graceful)
      
      raw_keys = registry['required_keys']
      required_keys = case raw_keys
                      when String then JSON.parse(raw_keys || '[]')
                      when Array then raw_keys
                      else []
                      end
      
      required_keys = Array(required_keys).map(&:to_s)
      missing_keys = required_keys - @metadata.keys.map(&:to_s)
      
      { ok: missing_keys.empty?, missing_keys: missing_keys }
    rescue JSON::ParserError => e
      Rails.logger.error("[G4-Analytics][Contract] JSON Parse Error for #{@event_type}: #{e.message}")
      { ok: false, missing_keys: ['INVALID_CONTRACT_JSON'] } # Bloqueia se o JSON estiver quebrado
    rescue StandardError => e
      Rails.logger.warn("[G4-Analytics][Contract] Unexpected failure for #{@event_type}: #{e.message}")
      { ok: true } # Fail-open para outros erros inesperados
    end

    def log_ingest_error(missing_keys)
      return unless ActiveRecord::Base.connection.table_exists?('event_ingest_errors')
      
      conn = ActiveRecord::Base.connection
      error_reason = "Missing required keys: #{missing_keys.join(', ')}"
      
      sql = <<~SQL
        INSERT INTO event_ingest_errors (
          event_id, event_type, payload, error_reason, occurred_at, created_at
        ) VALUES (
          #{conn.quote(@event_id)}, #{conn.quote(@event_type)}, #{conn.quote(@metadata.to_json)},
          #{conn.quote(error_reason)}, #{conn.quote(@occurred_at)}, #{conn.quote(Time.current)}
        )
      SQL
      conn.execute(sql)
    end

    def ensure_unique_event!
      return true unless ActiveRecord::Base.connection.table_exists?('analytics_event_dedup')
      
      connection = ActiveRecord::Base.connection
      adapter_name = connection.adapter_name.downcase
      
      if adapter_name.include?('postgresql')
        # PostgreSQL: INSERT ... ON CONFLICT DO NOTHING com verificação de resultado
        result = connection.execute("INSERT INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)}) ON CONFLICT (event_id) DO NOTHING")
        result.cmd_tuples > 0
      elsif adapter_name.include?('sqlite')
        # SQLite: INSERT OR IGNORE com verificação em raw_connection.changes
        connection.execute("INSERT OR IGNORE INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)})")
        connection.raw_connection.changes > 0
      else
        # Adapter não configurado - usar exception-based detection
        begin
          connection.execute("INSERT INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)})")
          true  # Inserção bem-sucedida
        rescue ActiveRecord::RecordNotUnique
          false  # Duplicate constraint violation
        end
        # Outros StatementInvalid propagam para rescue externo
      end
    rescue ActiveRecord::RecordNotUnique
      # Apenas constraint de unique violation = duplicata
      false
    end

    def persist_platform_event!
      return unless ActiveRecord::Base.connection.table_exists?('platform_events')

      conn = ActiveRecord::Base.connection
      payload = @metadata.to_json
      context = {}.to_json

      sql = <<~SQL
        INSERT INTO platform_events (
          event_id, event_type, schema_version, source, anonymous_id, session_id,
          user_id, company_id, subject_type, subject_id, payload, context, occurred_at, created_at
        ) VALUES (
          #{conn.quote(@event_id)}, #{conn.quote(@event_type)}, 1,
          #{conn.quote(@metadata['source'])}, #{conn.quote(@metadata['anonymous_id'])}, #{conn.quote(@metadata['session_id'])},
          #{conn.quote(@user&.id)}, #{conn.quote(@company_id)}, #{conn.quote(@metadata['subject_type'])}, #{conn.quote(@metadata['subject_id'])},
          #{conn.quote(payload)}, #{conn.quote(context)}, #{conn.quote(@occurred_at)}, #{conn.quote(Time.current)}
        )
      SQL
      conn.execute(sql)
    end

    def persist_analytics_event!
      return unless ActiveRecord::Base.connection.table_exists?('analytics_events')

      AnalyticsEvent.create!(
        company_id: @company_id,
        user_id: @user&.id,
        event_type: @event_type,
        metadata: @metadata,
        tracked_at: @occurred_at,
        event_id: @event_id
      )
    rescue ActiveRecord::RecordNotUnique
      nil
    end

    def forward_to_posthog
      distinct_id = @user&.posthog_distinct_id || @metadata['distinct_id'] || "company_#{@company_id}"
      
      # Map internal event types to PostHog V2 Taxonomy
      ph_event_name = @event_type
      ph_properties = @metadata.dup
      
      case @event_type
      when 'plan_changed'
        ph_event_name = 'plan_upgraded'
      when 'company_activated'
        ph_event_name = 'company_profile_completed' # Use consistent terminology
      end

      Analytics::PostHogService.capture(
        ph_event_name,
        ph_properties.merge(company_id: @company_id),
        distinct_id: distinct_id,
        timestamp: @occurred_at
      )
    rescue StandardError => e
      Rails.logger.warn("[G4-Analytics] PostHog Forwarding Failed: #{e.message}")
    end

    def normalized_event_type
      @normalized_event_type ||= @event_type.to_s.downcase.gsub(/\s+/, '_')
    end
  end
end
