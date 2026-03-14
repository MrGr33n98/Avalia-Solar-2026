# frozen_string_literal: true

require 'digest'
require 'json'
require 'set'

module SaasLeads
  class LeadTimeline
    Event = Struct.new(
      :occurred_at,
      :source,
      :event_type,
      :action,
      :phase,
      :intent_category, # :buyer_intent, :vendor_activity, :generic_navigation
      :details,
      keyword_init: true
    )

    ANONYMOUS_ID_KEYS = Set.new(%w[
      anonymous_id
      as_anonymous_id
      ajs_anonymous_id
      anon_id
      anonymousid
    ]).freeze

    SESSION_ID_KEYS = Set.new(%w[
      session_id
      as_sid
      sid
      sessionid
    ]).freeze

    # Events that clearly indicate buyer interest
    BUYER_INTENT_ACTIONS = Set.new(%w[
      profile_view
      cta_click
      lead_initiated
      lead_created
      lead_verified
      intent_scroll_pause
      company_tab_change
      whatsapp_click
      phone_click
      website_click
      form_start
      product_view
    ]).freeze

    # Events that clearly indicate administrative or vendor activity
    VENDOR_ACTIVITY_ACTIONS = Set.new([
      'Dashboard Tab Viewed',
      'Theme Changed',
      'login_completed',
      'logout_performed',
      'Report Exported',
      'admin_access_requested',
      'dashboard_update_requested',
      'api_key_generated'
    ]).freeze

    DEFAULT_WINDOW_DAYS = 30
    MAX_ANALYTICS_SCAN = 5000
    MAX_INTENT_SCAN = 3000

    def initialize(lead, window_days: DEFAULT_WINDOW_DAYS)
      @lead = lead
      @window_days = [window_days.to_i, 1].max
    end

    def events
      @events ||= begin
        rows = []
        rows.concat(lifecycle_events)
        rows.concat(distribution_events)
        rows.concat(analytics_events)
        rows.concat(intent_signal_events)

        deduplicate(rows).sort_by(&:occurred_at)
      rescue StandardError => e
        Rails.logger.warn("[SaasLeads::LeadTimeline] Failed to build timeline for lead=#{@lead.id}: #{e.class}: #{e.message}")
        []
      end
    end

    def summary
      @summary ||= begin
        data = events
        pre_lead_events = data.count { |item| item.phase == 'pre_lead' }
        post_lead_events = data.count - pre_lead_events
        unique_sessions = data.filter_map { |item| item.details['session_id'] || item.details[:session_id] }.uniq
        top_actions = data.group_by(&:action).transform_values(&:size).sort_by { |(_action, count)| -count }

        buyer_intent_count = data.count { |e| e.intent_category == :buyer_intent }
        vendor_activity_count = data.count { |e| e.intent_category == :vendor_activity }

        {
          total_events: data.size,
          pre_lead_events: pre_lead_events,
          post_lead_events: post_lead_events,
          buyer_intent_count: buyer_intent_count,
          vendor_activity_count: vendor_activity_count,
          unique_sessions_count: unique_sessions.size,
          first_event_at: data.first&.occurred_at,
          last_event_at: data.last&.occurred_at,
          top_actions: top_actions.first(3).map(&:first),
          anonymous_ids: identity_context[:anonymous_ids],
          session_ids: identity_context[:session_ids]
        }
      end
    end

    def tooltip_text
      stats = summary
      [
        "Historico real (#{@window_days}d)",
        "Eventos: #{stats[:total_events]}",
        "Intencao de Compra: #{stats[:buyer_intent_count]}",
        "Atividade Vendor/Admin: #{stats[:vendor_activity_count]}",
        "Antes de virar lead: #{stats[:pre_lead_events]}",
        "Depois de virar lead: #{stats[:post_lead_events]}",
        "Sessoes unicas: #{stats[:unique_sessions_count]}",
        "Primeiro evento: #{format_time(stats[:first_event_at])}",
        "Ultimo evento: #{format_time(stats[:last_event_at])}",
        "Top acoes: #{stats[:top_actions].presence&.join(', ') || '-'}"
      ].join("\n")
    end

    private

    def lifecycle_events
      rows = []
      rows << build_event(
        occurred_at: @lead.created_at,
        source: 'lead_record',
        event_type: 'lead_created',
        action: 'lead_created',
        details: { lead_id: @lead.id, wizard_status: @lead.wizard_status }.compact
      )

      if @lead.respond_to?(:otp_sent_at) && @lead.otp_sent_at.present?
        rows << build_event(
          occurred_at: @lead.otp_sent_at,
          source: 'lead_record',
          event_type: 'lead_otp_sent',
          action: 'otp_sent',
          details: { lead_id: @lead.id }
        )
      end

      if @lead.respond_to?(:otp_verified_at) && @lead.otp_verified_at.present?
        rows << build_event(
          occurred_at: @lead.otp_verified_at,
          source: 'lead_record',
          event_type: 'lead_verified',
          action: 'otp_verified',
          details: { lead_id: @lead.id }
        )
      end

      rows.compact
    end

    def distribution_events
      return [] unless @lead.respond_to?(:lead_distributions)

      @lead.lead_distributions.map do |distribution|
        occurred_at = distribution.assigned_at || distribution.created_at
        build_event(
          occurred_at: occurred_at,
          source: 'lead_distribution',
          event_type: 'lead_distributed',
          action: distribution.status.to_s.presence || 'queued',
          details: {
            distribution_id: distribution.id,
            company_id: distribution.company_id,
            status: distribution.status
          }.compact
        )
      end.compact
    end

    def analytics_events
      return [] unless analytics_available?

      scope = AnalyticsEvent.where(tracked_at: window_start..window_end)
      if @lead.respond_to?(:company_id) && @lead.company_id.present? && analytics_columns.include?('company_id')
        scope = scope.where(company_id: @lead.company_id)
      end

      scope.order(tracked_at: :desc).limit(MAX_ANALYTICS_SCAN).filter_map do |event|
        metadata = normalize_hash(event.metadata)
        next unless analytics_matches?(event, metadata)

        action =
          metadata['action'].presence ||
          metadata['event'].presence ||
          safe_column_value(event, 'action').presence ||
          event.event_type

        details = {
          session_id: metadata['session_id'].presence || safe_column_value(event, 'session_id'),
          anonymous_id: metadata['anonymous_id'].presence || safe_column_value(event, 'anonymous_id'),
          page_path: metadata['page_path'].presence || metadata['path'].presence,
          referrer_host: metadata['referrer_host'],
          source: metadata['source'],
          signal_category: metadata['signal_category'],
          intent_weight: metadata['intent_weight'],
          lead_id: metadata['lead_id']
        }.compact

        build_event(
          occurred_at: event.tracked_at,
          source: 'analytics_event',
          event_type: event.event_type,
          action: action,
          details: details
        )
      end
    end

    def intent_signal_events
      return [] unless intent_available?

      anonymous_ids = identity_context[:anonymous_ids]
      session_ids = identity_context[:session_ids]
      ip_hashes = identity_context[:ip_hashes]
      return [] if anonymous_ids.empty? && session_ids.empty? && ip_hashes.empty?

      scope = BuyerIntentActivity.where(tracked_at: window_start..window_end)
      if @lead.respond_to?(:company_id) && @lead.company_id.present? && intent_columns.include?('company_id')
        scope = scope.where(company_id: @lead.company_id)
      end

      conditions = []
      binds = {}
      if anonymous_ids.any?
        conditions << 'anonymous_id IN (:anonymous_ids)'
        binds[:anonymous_ids] = anonymous_ids
      end
      if session_ids.any?
        conditions << 'session_id IN (:session_ids)'
        binds[:session_ids] = session_ids
      end
      if ip_hashes.any? && intent_columns.include?('ip_hash')
        conditions << 'ip_hash IN (:ip_hashes)'
        binds[:ip_hashes] = ip_hashes
      end
      scope = scope.where(conditions.join(' OR '), binds) if conditions.any?

      scope.order(tracked_at: :desc).limit(MAX_INTENT_SCAN).map do |activity|
        details = {
          company_id: activity.company_id,
          session_id: activity.session_id,
          anonymous_id: activity.anonymous_id,
          page_path: activity.page_path,
          element_type: activity.element_type,
          intent_weight: activity.intent_weight,
          signal_category: activity.signal_category,
          duration_ms: activity.duration_ms
        }.compact

        build_event(
          occurred_at: activity.tracked_at,
          source: 'buyer_intent_activity',
          event_type: activity.signal_type,
          action: activity.signal_type,
          details: details
        )
      end
    end

    def analytics_matches?(event, metadata)
      lead_id_match = metadata['lead_id'].to_s == @lead.id.to_s

      anonymous_value = metadata['anonymous_id'].presence || safe_column_value(event, 'anonymous_id')
      session_value = metadata['session_id'].presence || safe_column_value(event, 'session_id')

      anonymous_match = anonymous_value.present? && identity_context[:anonymous_ids].include?(anonymous_value.to_s)
      session_match = session_value.present? && identity_context[:session_ids].include?(session_value.to_s)

      ip_match =
        @lead.respond_to?(:consent_ip) &&
        @lead.consent_ip.present? &&
        metadata['ip'].to_s == @lead.consent_ip.to_s

      lead_id_match || anonymous_match || session_match || ip_match
    end

    def build_event(occurred_at:, source:, event_type:, action:, details:)
      return nil if occurred_at.blank?

      Event.new(
        occurred_at: occurred_at,
        source: source.to_s,
        event_type: event_type.to_s,
        action: action.to_s,
        phase: pre_lead?(occurred_at) ? 'pre_lead' : 'post_lead',
        intent_category: determine_intent_category(action, details),
        details: details || {}
      )
    end

    def determine_intent_category(action, details)
      path = details['page_path'].to_s
      
      # Administrative patterns
      if action.match?(/Dashboard/i) || path.include?('/dashboard') || path.include?('/api/v1/company_dashboard')
        return :vendor_activity
      end

      return :buyer_intent if BUYER_INTENT_ACTIONS.include?(action)
      return :vendor_activity if VENDOR_ACTIVITY_ACTIONS.include?(action)
      
      # Default to navigation for common events not explicitly buyer intent
      :generic_navigation
    end

    def pre_lead?(occurred_at)
      return false if @lead.created_at.blank?

      occurred_at < @lead.created_at
    end

    def window_start
      anchor = @lead.created_at || Time.current
      anchor - @window_days.days
    end

    def window_end
      Time.current
    end

    def identity_context
      return @identity_context if defined?(@identity_context)

      sources = [normalize_hash(@lead.wizard_answers), normalize_hash(@lead.attribution_json)]
      anonymous_ids = extract_values(sources, ANONYMOUS_ID_KEYS)
      session_ids = extract_values(sources, SESSION_ID_KEYS)
      ip_hashes = []

      if @lead.respond_to?(:consent_ip) && @lead.consent_ip.present?
        ip_hashes << Digest::SHA256.hexdigest(@lead.consent_ip.to_s)
      end

      @identity_context = {
        anonymous_ids: anonymous_ids,
        session_ids: session_ids,
        ip_hashes: ip_hashes.uniq
      }
    end

    def extract_values(sources, key_set)
      values = []
      Array(sources).each { |source| collect_values(source, key_set, values) }
      values.filter_map { |value| normalize_identity(value) }.uniq
    end

    def collect_values(node, key_set, values)
      case node
      when Hash
        node.each do |key, value|
          values << value if key_set.include?(key.to_s.downcase)
          collect_values(value, key_set, values)
        end
      when Array
        node.each { |value| collect_values(value, key_set, values) }
      end
    end

    def normalize_identity(value)
      candidate = value.to_s.strip
      return nil if candidate.blank?

      candidate[0, 255]
    end

    def normalize_hash(value)
      case value
      when Hash
        value.deep_stringify_keys
      when String
        parsed = JSON.parse(value)
        parsed.is_a?(Hash) ? parsed.deep_stringify_keys : {}
      else
        {}
      end
    rescue JSON::ParserError
      {}
    end

    def deduplicate(rows)
      rows.uniq do |row|
        digest_payload = JSON.generate(row.details || {})
        [row.source, row.event_type, row.action, row.occurred_at.to_i, Digest::SHA1.hexdigest(digest_payload)]
      end
    end

    def analytics_available?
      defined?(AnalyticsEvent) && AnalyticsEvent.table_exists?
    end

    def intent_available?
      defined?(BuyerIntentActivity) && BuyerIntentActivity.table_exists?
    end

    def analytics_columns
      @analytics_columns ||= AnalyticsEvent.column_names
    end

    def intent_columns
      @intent_columns ||= BuyerIntentActivity.column_names
    end

    def safe_column_value(record, column_name)
      return nil unless record.respond_to?(:has_attribute?) && record.has_attribute?(column_name)

      record.public_send(column_name)
    end

    def format_time(value)
      return '-' if value.blank?

      I18n.l(value, format: :short)
    rescue StandardError
      value.to_s
    end
  end
end
