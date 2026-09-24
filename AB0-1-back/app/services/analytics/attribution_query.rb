# frozen_string_literal: true

module Analytics
  class AttributionQuery
    EVENT_TYPES = %w[profile_view cta_click lead_created].freeze
    CATEGORIES = %w[visits cta_clicks leads].freeze
    TOUCH_EVENTS = %w[profile_view cta_click].freeze
    JOURNEY_KEYS = %w[lead_id session_id anonymous_id user_id].freeze

    def self.call(company_id:, from_time:, to_time:, attribution_model: 'last_touch', limit: 20)
      new(company_id:, from_time:, to_time:, attribution_model:, limit:).call
    end

    def initialize(company_id:, from_time:, to_time:, attribution_model: 'last_touch', limit: 20)
      @company_id = company_id
      @from_time = from_time
      @to_time = to_time
      @model = attribution_model.to_s.in?(%w[first_touch last_touch]) ? attribution_model.to_s : 'last_touch'
      @limit = [[limit.to_i, 1].max, 100].min
    end

    def call
      events = filtered_events.to_a
      rows = events.reject { |event| internal_traffic?(event) }.map { |event| row_for(event, events) }
      { summary: summary(rows), channels: grouped(rows, :channel), campaigns: grouped(rows, :campaign),
        cta_matrix: grouped(rows, :cta), landing_pages: grouped(rows, :landing_pages) }
    end

    private

    def filtered_events
      AnalyticsEvent.where(company_id: @company_id, tracked_at: @from_time..@to_time)
                    .where(event_type: Analytics::EventTaxonomy.aliases_for('profile_view') +
                                      Analytics::EventTaxonomy.aliases_for('cta_click') +
                                      Analytics::EventTaxonomy.aliases_for('lead_created'))
                    .order(:tracked_at, :id)
    end

    def internal_traffic?(event)
      metadata = event_metadata(event).to_h
      %w[is_internal is_employee is_admin].any? { |key| metadata[key].to_s == 'true' }
    end

    def row_for(event, events)
      metadata = selected_touch_metadata(event, events)
      classification = Analytics::AttributionClassifier.call(metadata)
      {
        event_type: Analytics::EventTaxonomy.canonical(event.event_type),
        classification: classification,
        cta_type: Analytics::EventTaxonomy.cta_type(event.event_type, event_metadata(event).to_h).presence || 'other',
        landing_path: clean_path(metadata.to_h['landing_path'] || metadata.to_h['path'])
      }
    end

    def selected_touch_metadata(event, events)
      metadata = event_metadata(event)
      candidates = journey_events(event, events)
      return metadata if candidates.empty?

      selected = @model == 'first_touch' ? candidates.first : candidates.last
      selected_metadata = event_metadata(selected)
      attribution = selected_metadata.dig('attribution', @model)
      values = attribution.is_a?(Hash) && attribution['values'].is_a?(Hash) ? attribution['values'] : {}
      referrer_host = attribution.is_a?(Hash) ? attribution['referrer_host'] : selected_metadata['referrer_host']
      selected_metadata.merge(values).merge('referrer_host' => referrer_host)
    end

    def journey_events(event, events)
      metadata = event_metadata(event)
      return [] if journey_identifiers(metadata).empty?

      events.select do |candidate|
        candidate_metadata = event_metadata(candidate)
        next false unless TOUCH_EVENTS.include?(Analytics::EventTaxonomy.canonical(candidate.event_type))
        next false unless shared_journey_identifier?(metadata, candidate_metadata)

        candidate.tracked_at <= event.tracked_at
      end.sort_by { |candidate| [candidate.tracked_at, candidate.id] }
    end

    def journey_identifiers(metadata)
      JOURNEY_KEYS.filter_map do |key|
        value = metadata.to_h[key].presence
        [key, value] if value
      end.to_h
    end

    def shared_journey_identifier?(left, right)
      left_ids = journey_identifiers(left)
      right_ids = journey_identifiers(right)
      JOURNEY_KEYS.any? { |key| left_ids[key].present? && left_ids[key] == right_ids[key] }
    end

    def event_metadata(event)
      event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : nil
    end

    def summary(rows)
      visits = rows.count { |row| row[:event_type] == 'profile_view' }
      cta_clicks = rows.count { |row| row[:event_type] == 'cta_click' }
      leads = rows.count { |row| row[:event_type] == 'lead_created' }
      classified = rows.count { |row| row[:classification][:attribution_quality] != 'unknown' }
      {
        visits: visits,
        cta_clicks: cta_clicks,
        leads: leads,
        attributed_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:attribution_quality] == 'utm' },
        direct_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:channel_group] == 'Direct' },
        unknown_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:channel_group] == 'Unknown' },
        attribution_coverage_pct: percentage(classified, rows.size),
        ctr: percentage(cta_clicks, visits),
        profile_to_lead_conversion: percentage(leads, visits),
        cta_to_lead_rate: percentage(leads, cta_clicks),
        # Mantido durante a transição para clientes que ainda leem este campo.
        conversion_rate: percentage(leads, visits)
      }
    end

    def grouped(rows, kind)
      rows = rows.reject { |row| kind == :campaign && row[:classification][:campaign].blank? }
      records = rows.group_by { |row| group_key(row, kind) }.map { |key, values| aggregate(key, values, kind) }
      records.sort_by { |row| [-row[:leads].to_i, -row[:visits].to_i] }.first(@limit)
    end

    def group_key(row, kind)
      classification = row[:classification]
      case kind
      when :channel then [classification[:channel_group], classification[:source], classification[:medium]]
      when :campaign then [classification[:source], classification[:medium], classification[:campaign]]
      when :landing_pages then [row[:landing_path]]
      else [classification[:channel_group], classification[:source]]
      end
    end

    def aggregate(key, values, kind)
      visits = values.count { |row| row[:event_type] == 'profile_view' }
      clicks = values.count { |row| row[:event_type] == 'cta_click' }
      leads = values.count { |row| row[:event_type] == 'lead_created' }
      base = {
        visits: visits,
        cta_clicks: clicks,
        leads: leads,
        ctr: percentage(clicks, visits),
        profile_to_lead_conversion: percentage(leads, visits),
        cta_to_lead_rate: percentage(leads, clicks),
        conversion_rate: percentage(leads, visits)
      }
      return base.merge(channel_group: key[0], source: key[1], medium: key[2], cta_breakdown: cta_breakdown(values)) if kind == :channel
      return base.merge(source: key[0], medium: key[1], campaign: key[2]) if kind == :campaign && key[2].present?
      return base.merge(landing_path: key[0]) if kind == :landing_pages

      base.merge(channel_group: key[0], source: key[1], **cta_breakdown(values), total_clicks: clicks)
    end

    def cta_breakdown(values)
      values.select { |row| row[:event_type] == 'cta_click' }.group_by { |row| row[:cta_type] }.transform_values(&:count)
           .then { |result| %w[whatsapp email phone website quote other].index_with { |key| result[key].to_i } }
    end

    def percentage(numerator, denominator)
      return nil unless denominator.to_i.positive?

      (numerator.to_f / denominator * 100).round(2)
    end

    def clean_path(path)
      value = path.to_s.split(/[?#]/).first.to_s
      value.start_with?('/') ? value : nil
    end
  end
end
