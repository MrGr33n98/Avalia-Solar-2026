# frozen_string_literal: true

module CompanyDashboard
  class TrackingWorkspaceService
    COMPONENTS = [
      ['tracking', 'Tracking Avalia Solar', :tracking_received?, 'attention'],
      ['first_touch', 'First Touch', :first_touch_available?, 'attention'],
      ['last_touch', 'Last Touch', :last_touch_available?, 'attention'],
      ['utm', 'Captura UTM', :utm_available?, 'attention'],
      ['clicks', 'Clicks', :clicks_available?, 'not_configured'],
      ['attribution', 'Atribuição', :attribution_available?, 'attention']
    ].freeze

    POLICY = {
      inbound_source: 'configurable',
      outbound_source: Analytics::TrackingTaxonomy::ORGANIC_SOURCE,
      ads_source: Analytics::TrackingTaxonomy::ADS_SOURCE,
      internal_identity: 'click_id/impression_id/delivery_id'
    }.freeze

    def self.call(company:, from_time:, to_time:, advanced: false, attribution_model: 'last_touch')
      new(company:, from_time:, to_time:, advanced:, attribution_model:).call
    end

    def initialize(company:, from_time:, to_time:, advanced: false, attribution_model: 'last_touch')
      @company = company
      @from_time = from_time
      @to_time = to_time
      @advanced = advanced
      @attribution_model = normalize_model(attribution_model)
    end

    def call
      events = events_scope.to_a
      attribution = attribution_for
      health = health_payload(events)
      build_payload(events, attribution, health)
    end

    private

    def normalize_model(value)
      model = value.to_s
      %w[first_touch last_touch].include?(model) ? model : 'last_touch'
    end

    def attribution_for
      Analytics::AttributionQuery.call(
        company_id: @company.id,
        from_time: @from_time,
        to_time: @to_time,
        attribution_model: @attribution_model,
        limit: @advanced ? 100 : 3
      )
    end

    def build_payload(events, attribution, health)
      {
        version: Analytics::TrackingTaxonomy::VERSION,
        attribution_model: @attribution_model,
        status: events.empty? ? 'empty' : 'ready',
        data_source: 'analytics_events',
        range: { from: @from_time.to_date.iso8601, to: @to_time.to_date.iso8601 },
        summary: canonical_events?(events) ? attribution[:summary] : nil,
        channels: @advanced ? attribution[:channels] : attribution[:channels].first(3),
        campaigns: @advanced ? attribution[:campaigns] : [],
        cta_matrix: @advanced ? attribution[:cta_matrix] : [],
        landing_pages: @advanced ? attribution[:landing_pages] : [],
        health: health,
        diagnostics: diagnostics(events, health),
        capabilities: capabilities,
        policy: POLICY
      }
    end

    def events_scope
      AnalyticsEvent.where(company_id: @company.id, tracked_at: @from_time..@to_time).order(:tracked_at, :id)
    end

    def capabilities
      { core: true, advanced: @advanced, saved_links: false, export: @advanced,
        conversion_tracking: 'not_configured' }
    end

    def health_payload(events)
      items = COMPONENTS.map { |key, label, predicate, missing| health_item(events, key, label, predicate, missing) }
      status = events.empty? ? 'not_configured' : overall_health_status(items, events)
      { status:, healthy: items.count { |item| item[:status] == 'healthy' }, total: items.length, items: }
    end

    def health_item(events, key, label, predicate, missing_status)
      matching = events.select { |event| send(predicate, event) }
      status = if events.empty?
                 'not_configured'
               elsif matching.any?
                 'healthy'
               else
                 missing_status
               end
      { key:, label:, status:, observed: matching.length,
        last_observed_at: matching.last&.tracked_at&.iso8601, detail: detail_for(key, status) }
    end

    def overall_health_status(items, events)
      return 'attention' if unknown_event_count(events).positive?

      items.any? { |item| item[:status] == 'attention' } ? 'attention' : 'healthy'
    end

    def diagnostics(events, health)
      result = { checked_at: Time.current.iso8601, event_count: events.length,
                 unknown_event_count: unknown_event_count(events), components: health[:items] }
      return result unless @advanced

      result.merge(advanced_diagnostics(events))
    end

    def advanced_diagnostics(events)
      { identity_coverage_pct: percentage(events.count { |event| identity_available?(event) }, events.length),
        utm_coverage_pct: percentage(events.count { |event| utm_available?(event) }, events.length),
        click_id_count: events.count { |event| metadata(event)['click_id'].present? },
        surface_count: events.filter_map { |event| metadata(event)['surface'] }.uniq.length,
        placement_count: events.filter_map { |event| metadata(event)['placement'] }.uniq.length }
    end

    def canonical_events?(events)
      events.any? { |event| canonical_event?(event) }
    end

    def canonical_event?(event)
      %w[profile_view cta_click lead_created].include?(Analytics::EventTaxonomy.canonical(event.event_type).to_s)
    end

    def unknown_event_count(events)
      events.count { |event| !canonical_event?(event) }
    end

    def tracking_received?(event)
      event.present?
    end

    def identity_available?(event)
      data = metadata(event)
      identity = %w[session_id anonymous_id user_id lead_id].any? { |key| data[key].present? }
      identity || data.dig('attribution', 'first_touch').present?
    end

    def first_touch_available?(event)
      touch_available?(event, 'first_touch')
    end

    def last_touch_available?(event)
      touch_available?(event, 'last_touch')
    end

    def touch_available?(event, model)
      return false unless canonical_event?(event)

      metadata(event).dig('attribution', model).present? || identity_available?(event)
    end

    def utm_available?(event)
      metadata(event)['utm_source'].present?
    end

    def clicks_available?(event)
      Analytics::EventTaxonomy.canonical(event.event_type) == 'cta_click'
    end

    def attribution_available?(event)
      return false unless canonical_event?(event)

      classification = Analytics::AttributionClassifier.call(metadata(event))
      classification[:attribution_quality].to_s != 'unknown'
    end

    def metadata(event)
      value = event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : {}
      context = event.context.is_a?(Hash) ? event.context.stringify_keys : {}
      context.merge(value)
    end

    def detail_for(key, status)
      return 'Nenhum evento recebido no período.' if status == 'not_configured'
      return 'Há eventos, mas este sinal ainda não foi identificado.' if status == 'attention'

      {
        'tracking' => 'Eventos da empresa recebidos pela plataforma.',
        'first_touch' => 'Primeiro touch elegível disponível.',
        'last_touch' => 'Último touch elegível disponível.',
        'utm' => 'UTM identificada em eventos recebidos.',
        'clicks' => 'Cliques canônicos recebidos.',
        'attribution' => 'Eventos classificados com origem reconhecível.'
      }.fetch(key.to_s)
    end

    def percentage(numerator, denominator)
      return nil if denominator.to_i.zero?

      (numerator.to_f / denominator * 100).round(1)
    end
  end
end
