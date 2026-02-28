# frozen_string_literal: true

require 'uri'
require 'json'

module Analytics
  class TrackEventService
    Result = Struct.new(:ok, :event, :error, keyword_init: true)

    GLOBAL_EVENTS = %w[page_view search landing_view web_vital].freeze
    INTERNAL_SYSTEM_EVENTS = %w[page_view search landing_view theme_changed theme_changed_dashboard web_vital performance_metric error_occurred].freeze
    
    def self.call(company_id:, event_type:, metadata: {}, user: nil, tracked_at: nil, event_id: nil)
      new(company_id: company_id, event_type: event_type, metadata: metadata, user: user, occurred_at: tracked_at, event_id: event_id).call
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

      company = Company.find_by(id: @company_id) if @company_id.present?

      if @company_id.blank? && GLOBAL_EVENTS.include?(normalized_event_type)
        return Result.new(ok: true, event: nil, error: 'global_event_without_company_skipped')
      end

      return Result.new(ok: false, error: 'company_id missing for event') if @company_id.blank?

      unless validate_contract!
        return Result.new(ok: false, error: 'invalid_contract')
      end
      
      unless ensure_unique_event!
        return Result.new(ok: true, event: nil, error: 'duplicate_event')
      end

      persist_platform_event!
      
      Result.new(ok: true)
    rescue StandardError => e
      Rails.logger.error("[G4-Analytics] TrackEventService error: #{e.class} #{e.message}")        
      Result.new(ok: false, error: e.message)
    end

    private

    def validate_contract!
      return true unless ActiveRecord::Base.connection.table_exists?('event_definitions')
      
      registry = Analytics::EventRegistry.fetch(@event_type)
      return true if registry.nil?
      
      true
    end

    def ensure_unique_event!
      return true unless ActiveRecord::Base.connection.table_exists?('analytics_event_dedup')
      
      conn = ActiveRecord::Base.connection
      sql = "INSERT INTO analytics_event_dedup (event_id, inserted_at) VALUES (#{conn.quote(@event_id)}, #{conn.quote(Time.current)}) ON CONFLICT DO NOTHING"
      
      conn.execute(sql)
      true 
    rescue ActiveRecord::RecordNotUnique
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

    def normalized_event_type
      @normalized_event_type ||= @event_type.to_s.downcase.gsub(/\s+/, '_')
    end
  end
end
