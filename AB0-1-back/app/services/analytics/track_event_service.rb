# frozen_string_literal: true

require 'uri'
require 'json'

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    GLOBAL_EVENTS = %w[page_view search landing_view web_vital].freeze
    INTERNAL_SYSTEM_EVENTS = %w[page_view search landing_view theme_changed theme_changed_dashboard web_vital
                                performance_metric error_occurred].freeze

    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      # FEATURE FLAG & KILL SWITCH GLOBAL
      # Default is enabled. Explicit 'false' disables ingestion.
      # This keeps dashboard telemetry alive even when legacy GA4 env vars are absent.
      is_enabled = ENV['G4_ANALYTICS_ENABLED'] != 'false' || Rails.env.test?

      unless is_enabled
        Rails.logger.info('[G4-Analytics] Analytics disabled by flag G4_ANALYTICS_ENABLED=false')
        return Result.new(ok: true, error: 'analytics_disabled_by_flag')
      end

      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at,
          event_id: event_id).call
    rescue StandardError => e
      # Garantia final: NUNCA quebrar o chamador por erro de Analytics
      Rails.logger.error("[G4-Analytics] Critical Failure in Service: #{e.class} - #{e.message}")
      Result.new(ok: false, error: 'analytics_service_error')
    end

    def initialize(company_id:, event_type:, metadata: {}, user: nil, occurred_at: nil, event_id: nil, user_id: nil)
      @company_id = company_id
      @user = user || (user_id ? User.find_by(id: user_id) : nil)
      @event_type = event_type.to_s
      @metadata = sanitize_metadata(metadata)
      @occurred_at = occurred_at.presence || Time.current
      @event_id = event_id || "evt_#{Time.current.to_i}_#{SecureRandom.hex(6)}"

      # Enriquecimento de versionamento e ambiente
      @metadata['event_version'] ||= '1'
      @metadata['schema_version'] ||= '1.0.0'
      @metadata['api_version'] ||= 'v1'
      @metadata['environment'] ||= Rails.env.to_s

      if @user
        is_employee = @user.email.to_s.end_with?('@avaliasolar.com.br')
        is_admin = @user.respond_to?(:admin?) ? @user.admin? : (@user.role == 'admin')
        @metadata['is_admin'] = is_admin if @metadata['is_admin'].nil?
        @metadata['is_employee'] = is_employee if @metadata['is_employee'].nil?
        @metadata['is_internal'] = (is_admin || is_employee) if @metadata['is_internal'].nil?
      end
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

        if strict_mode? && !fatal_strict_mode?
          return Result.new(ok: true, event: nil, error: 'contract_violation_discarded')
        end

        # Staging/test hard mode: expose invalid contracts without affecting production flows.
        if strict_mode?
          return Result.new(ok: false,
                            error: "contract_violation: missing_keys=#{validation_result[:missing_keys].join(',')}")
        end
      end

      return Result.new(ok: true, event: nil, error: 'duplicate_event') unless ensure_unique_event!

      persist_platform_event!
      event = persist_analytics_event!

      Feed::InterestGraph.record(user: @user, event_type: @event_type, metadata: @metadata,
                                 occurred_at: @occurred_at) if event.present?

      # Forward to PostHog for Product Analytics (Sprint 3)
      forward_to_posthog if ENV['POSTHOG_API_KEY'].present?

      # Sync Review Telemetry Cache (Solar Reviews 2.0)
      Reviews::TelemetryAggregator.call(@event_type, @metadata) if @event_type.start_with?('review_')

      Result.new(ok: true, event: event)
    rescue StandardError => e
      Rails.logger.error("[G4-Analytics] TrackEventService error: #{e.class} #{e.message}")
      Result.new(ok: false, error: 'analytics_processing_error')
    end

    private

    def strict_mode?
      ENV['G4_ANALYTICS_STRICT_MODE'] == 'true'
    end

    def fatal_strict_mode?
      return false if Rails.env.production?

      Rails.env.test? || Rails.env.staging?
    end

    def validate_contract!
      registry = Analytics::EventRegistry.fetch(@event_type)
      if registry.nil?
        return { ok: false, missing_keys: ['UNKNOWN_EVENT'] } if strict_mode?

        return { ok: true }
      end

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

    def sanitize_metadata(metadata)
      raw = metadata.is_a?(Hash) ? metadata : {}
      Analytics::LgpdAnonymizer.new(raw).anonymize
    end

    def ensure_unique_event!
      return true unless ActiveRecord::Base.connection.table_exists?('analytics_event_dedup')

      connection = ActiveRecord::Base.connection
      adapter_name = connection.adapter_name.downcase

      if adapter_name.include?('postgresql')
        # PostgreSQL: INSERT ... ON CONFLICT DO NOTHING com verificação de resultado
        result = connection.execute("INSERT INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)}) ON CONFLICT (event_id) DO NOTHING")
        result.cmd_tuples.positive?
      elsif adapter_name.include?('sqlite')
        # SQLite: INSERT OR IGNORE com verificação em raw_connection.changes
        connection.execute("INSERT OR IGNORE INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)})")
        connection.raw_connection.changes.positive?
      else
        # Adapter não configurado - usar exception-based detection
        begin
          connection.execute("INSERT INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{connection.quote(@event_id)}, #{connection.quote(Time.current)})")
          true # Inserção bem-sucedida
        rescue ActiveRecord::RecordNotUnique
          false # Duplicate constraint violation
        end
        # Outros StatementInvalid propagam para rescue externo
      end
    rescue ActiveRecord::RecordNotUnique
      # Apenas constraint de unique violation = duplicata
      false
    end

    def persist_platform_event!
      return unless ActiveRecord::Base.connection.table_exists?('platform_events')

      ensure_platform_events_partition!
      ActiveRecord::Base.connection.execute(platform_event_insert_sql)
    rescue ActiveRecord::StatementInvalid => e
      raise unless missing_platform_events_partition?(e)

      Rails.logger.warn("[G4-Analytics] Missing platform_events partition for #{@occurred_at}; creating and retrying")
      ensure_platform_events_partition!(force: true)
      ActiveRecord::Base.connection.execute(platform_event_insert_sql)
    end

    def platform_event_insert_sql
      conn = ActiveRecord::Base.connection
      payload = @metadata.to_json
      context = {}.to_json

      <<~SQL
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
    end

    def ensure_platform_events_partition!(force: false)
      conn = ActiveRecord::Base.connection
      return unless conn.adapter_name.downcase.include?('postgresql')
      return unless platform_events_partitioned?(conn)

      partition_key = @occurred_at.to_time.utc.strftime('%Y%m')
      return if !force && Rails.cache.exist?("platform_events_partition:#{partition_key}")

      conn.execute("SELECT create_platform_events_partition(#{conn.quote(@occurred_at)})")
      Rails.cache.write("platform_events_partition:#{partition_key}", true, expires_in: 1.day)
    rescue ActiveRecord::StatementInvalid => e
      Rails.logger.warn("[G4-Analytics] Unable to ensure platform_events partition: #{e.message}")
    end

    def platform_events_partitioned?(conn)
      conn.select_value("SELECT EXISTS(SELECT 1 FROM pg_partitioned_table WHERE partrelid = 'platform_events'::regclass)")
    rescue ActiveRecord::StatementInvalid
      false
    end

    def missing_platform_events_partition?(error)
      error.message.include?('no partition of relation "platform_events" found for row')
    end

    def persist_analytics_event!
      return unless ActiveRecord::Base.connection.table_exists?('analytics_events')

      brand_id = normalize_brand_id(@metadata['brand_id'])
      brand_slug = @metadata['brand_slug'].presence
      app_key = @metadata['app_key'].presence

      AnalyticsEvent.create!(
        company_id: @company_id,
        user_id: @user&.id,
        event_type: @event_type,
        metadata: @metadata,
        tracked_at: @occurred_at,
        event_id: @event_id,
        brand_id: brand_id,
        brand_slug: brand_slug,
        app_key: app_key
      )
    rescue ActiveRecord::RecordNotUnique
      nil
    end

    def forward_to_posthog
      # Evita reenviar page_view e web_vitals do frontend para o PostHog via servidor (evita duplicidade com SDK JS)
      return if %w[page_view page_viewed web_vital web_vitals].include?(@event_type) && @metadata['source'] != 'server'

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

      if @company_id.present?
        company = Company.find_by(id: @company_id)
        if company
          ph_properties[:company_name] = company.name
          ph_properties[:category_name] = company.categories.first&.name if company.categories.exists?
        end
      end

      Analytics::PostHogService.capture(
        ph_event_name,
        ph_properties.merge(
          company_id: @company_id,
          timestamp: @occurred_at
        ),
        distinct_id: distinct_id
      )
    rescue StandardError => e
      Rails.logger.warn("[G4-Analytics] PostHog Forwarding Failed: #{e.message}")
    end

    def normalized_event_type
      @normalized_event_type ||= @event_type.to_s.downcase.gsub(/\s+/, '_')
    end

    def normalize_brand_id(raw)
      return nil if raw.blank?
      return raw if raw.is_a?(Integer)

      raw.to_s.match?(/\A\d+\z/) ? raw.to_i : nil
    end
  end
end
