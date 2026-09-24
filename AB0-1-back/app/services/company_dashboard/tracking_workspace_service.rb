# frozen_string_literal: true

module CompanyDashboard
  class TrackingWorkspaceService
    COMPONENTS = [
      ['tracking', 'Tracking Avalia Solar', :tracking_received, 'attention'],
      ['first_touch', 'First Touch', :identity_available, 'attention'],
      ['last_touch', 'Last Touch', :identity_available, 'attention'],
      ['utm', 'Captura UTM', :utm_available, 'attention'],
      ['clicks', 'Clicks', :clicks_available, 'not_configured'],
      ['attribution', 'Atribuição', :attribution_available, 'attention']
    ].freeze

    def self.call(company:, from_time:, to_time:, advanced: false, attribution_model: 'last_touch')
      new(company:, from_time:, to_time:, advanced:, attribution_model:).call
    end

    def initialize(company:, from_time:, to_time:, advanced: false, attribution_model: 'last_touch')
      @company = company
      @from_time = from_time
      @to_time = to_time
      @advanced = advanced
      @attribution_model = %w[first_touch last_touch].include?(attribution_model.to_s) ? attribution_model.to_s : 'last_touch'
    end

    def call
      events = events_scope.to_a
      attribution = Analytics::AttributionQuery.call(
        company_id: @company.id,
        from_time: @from_time,
        to_time: @to_time,
        attribution_model: @attribution_model,
        limit: @advanced ? 100 : 3
      )
      health = health_payload(events)
      {
        version: Analytics::TrackingTaxonomy::VERSION,
        attribution_model: @attribution_model,
        status: events.empty? ? 'empty' : 'ready',
        data_source: 'analytics_events',
        range: { from: @from_time.to_date.iso8601, to: @to_time.to_date.iso8601 },
        summary: events.empty? ? nil : attribution[:summary],
        channels: @advanced ? attribution[:channels] : attribution[:channels].first(3),
        campaigns: @advanced ? attribution[:campaigns] : [],
        cta_matrix: @advanced ? attribution[:cta_matrix] : [],
        landing_pages: @advanced ? attribution[:landing_pages] : [],
        health: health,
        diagnostics: diagnostics(events, health),
        capabilities: {
          core: true,
          advanced: @advanced,
          saved_links: false,
          export: @advanced,
          conversion_tracking: 'not_configured'
        },
        policy: {
          inbound_source: 'configurable',
          outbound_source: Analytics::TrackingTaxonomy::ORGANIC_SOURCE,
          ads_source: Analytics::TrackingTaxonomy::ADS_SOURCE,
          internal_identity: 'click_id/impression_id/delivery_id'
        }
      }
    end

    private

    def events_scope
      AnalyticsEvent.where(company_id: @company.id, tracked_at: @from_time..@to_time)
                    .order(:tracked_at, :id)
    end

    def health_payload(events)
      items = COMPONENTS.map do |key, label, predicate, missing_status|
        matching = events.select { |event| send(predicate, event) }
        status = if events.empty?
                   'not_configured'
                 elsif matching.any?
                   'healthy'
                 else
                   missing_status
                 end
        {
          key: key,
          label: label,
          status: status,
          observed: matching.length,
          last_observed_at: matching.last&.tracked_at&.iso8601,
          detail: detail_for(key, status)
        }
      end
      healthy = items.count { |item| item[:status] == 'healthy' }
      overall = if events.empty?
                  'not_configured'
                elsif items.any? { |item| item[:status] == 'attention' }
                  'attention'
                else
                  'healthy'
                end
      { status: overall, healthy: healthy, total: items.length, items: items }
    end

    def diagnostics(events, health)
      result = {
        checked_at: Time.current.iso8601,
        event_count: events.length,
        unknown_event_count: events.count { |event| !%w[profile_view cta_click lead_created].include?(Analytics::EventTaxonomy.canonical(event.event_type).to_s) },
        components: health[:items]
      }
      return result unless @advanced

      result.merge(
        identity_coverage_pct: percentage(events.count { |event| identity_available(event) }, events.length),
        utm_coverage_pct: percentage(events.count { |event| utm_available(event) }, events.length),
        click_id_count: events.count { |event| metadata(event)['click_id'].present? },
        surface_count: events.filter_map { |event| metadata(event)['surface'] }.uniq.length,
        placement_count: events.filter_map { |event| metadata(event)['placement'] }.uniq.length
      )
    end

    def tracking_received(event)
      event.present?
    end

    def identity_available(event)
      data = metadata(event)
      %w[session_id anonymous_id user_id lead_id].any? { |key| data[key].present? } || data.dig('attribution', 'first_touch').present?
    end

    def utm_available(event)
      metadata(event)['utm_source'].present?
    end

    def clicks_available(event)
      Analytics::EventTaxonomy.canonical(event.event_type) == 'cta_click'
    end

    def attribution_available(event)
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

      (numerator.to_f / denominator.to_f * 100).round(1)
    end
  end
end
