# frozen_string_literal: true

module Analytics
  class AttributionQuery
    EVENT_TYPES = %w[profile_view cta_click lead_created].freeze
    CATEGORIES = %w[visits cta_clicks leads].freeze

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
      rows = filtered_events.reject { |event| internal_traffic?(event) }.map { |event| row_for(event) }
      { summary: summary(rows), channels: grouped(rows, :channel), campaigns: grouped(rows, :campaign),
        cta_matrix: grouped(rows, :cta), landing_pages: grouped(rows, :landing_pages) }
    end

    private

    def filtered_events
      scope = AnalyticsEvent.where(company_id: @company_id, tracked_at: @from_time..@to_time)
      scope = scope.where(event_type: Analytics::EventTaxonomy.aliases_for("profile_view") + Analytics::EventTaxonomy.aliases_for("cta_click") + Analytics::EventTaxonomy.aliases_for("lead_created"))
      scope
    end

    def internal_traffic?(event)
      metadata = event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : {}
      %w[is_internal is_employee is_admin].any? { |key| metadata[key].to_s == "true" }
    end

    def row_for(event)
      metadata = event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : {}
      touch = metadata.dig("attribution", @model) || {}
      source_metadata = touch["values"].is_a?(Hash) ? metadata.merge(touch["values"]).merge("referrer_host" => (touch["referrer_host"] || metadata["referrer_host"]))  : metadata
      classification = AttributionClassifier.call(source_metadata)
      { event_type: Analytics::EventTaxonomy.canonical(event.event_type), classification:, cta_type: Analytics::EventTaxonomy.cta_type(event.event_type, metadata).presence || "other",
        landing_path: clean_path(touch["landing_path"] || metadata["landing_path"] || metadata["path"]) }
    end

    def summary(rows)
      visits = rows.count { |row| row[:event_type] == 'profile_view' }
      cta_clicks = rows.count { |row| row[:event_type] == 'cta_click' }
      leads = rows.count { |row| row[:event_type] == 'lead_created' }
      classified = rows.count { |row| row[:classification][:attribution_quality] != 'unknown' }
      { visits:, cta_clicks:, leads:, attributed_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:attribution_quality] == 'utm' },
        direct_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:channel_group] == 'Direct' },
        unknown_visits: rows.count { |r| r[:event_type] == 'profile_view' && r[:classification][:channel_group] == 'Unknown' },
        attribution_coverage_pct: percentage(classified, rows.size), conversion_rate: percentage(leads, visits) }
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
      base = { visits:, cta_clicks: clicks, leads:, conversion_rate: percentage(leads, visits) }
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
      denominator.to_i.positive? ? (numerator.to_f / denominator * 100).round(2) : 0.0
    end

    def clean_path(path)
      value = path.to_s.split(/[?#]/).first
      value.start_with?('/') ? value : nil
    end
  end
end
