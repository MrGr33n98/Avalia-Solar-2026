# frozen_string_literal: true

module Analytics
  class UtmAttributionService
    PROFILE_VIEW_EVENTS = %w[profile_view Company\ Profile\ Viewed company_profile_viewed].freeze
    CTA_CLICK_EVENTS = %w[
      cta_click
      CTA\ Clicked
      cta_clicked
      company_cta_clicked
      company_cta_quote
    ].freeze
    LEAD_EVENTS = %w[lead_created Lead\ Form\ Submitted].freeze

    def self.call(event:)
      new(event: event).call
    end

    def initialize(event:)
      @event = event
      @metadata = event.metadata.is_a?(Hash) ? event.metadata.stringify_keys : {}
    end

    def call
      return false if @event.blank?
      return false if @event.company_id.blank?
      return false if @metadata['utm_source'].blank?

      attribution = CompanyUtmAttribution.find_or_initialize_by(
        company_id: @event.company_id,
        utm_source: @metadata['utm_source'],
        utm_medium: @metadata['utm_medium'],
        utm_campaign: @metadata['utm_campaign']
      )

      attribution.utm_content = @metadata['utm_content'] if @metadata['utm_content'].present?
      attribution.utm_term = @metadata['utm_term'] if @metadata['utm_term'].present?
      attribution.first_seen_at ||= tracked_on
      attribution.last_seen_at = tracked_on

      apply_counters!(attribution)
      attribution.conversion_rate = if attribution.total_visits.to_i.positive?
                                      ((attribution.total_leads.to_f / attribution.total_visits) * 100).round(2)
                                    else
                                      0.0
                                    end
      attribution.save!
      true
    rescue StandardError => e
      Rails.logger.error("[Analytics::UtmAttributionService] #{e.class}: #{e.message}")
      false
    end

    private

    def tracked_on
      (@event.tracked_at || Time.current).to_date
    end

    def canonical_event_type
      @event.event_type.to_s
    end

    def apply_counters!(attribution)
      if PROFILE_VIEW_EVENTS.include?(canonical_event_type)
        attribution.total_visits = attribution.total_visits.to_i + 1
      end

      if CTA_CLICK_EVENTS.include?(canonical_event_type)
        attribution.total_cta_clicks = attribution.total_cta_clicks.to_i + 1

        case @metadata['cta_type'].to_s
        when 'whatsapp'
          attribution.whatsapp_clicks = attribution.whatsapp_clicks.to_i + 1
        when 'email'
          attribution.email_clicks = attribution.email_clicks.to_i + 1
        when 'phone'
          attribution.phone_clicks = attribution.phone_clicks.to_i + 1
        when 'website'
          attribution.website_clicks = attribution.website_clicks.to_i + 1
        when 'quote'
          attribution.quote_clicks = attribution.quote_clicks.to_i + 1 if attribution.respond_to?(:quote_clicks)
        end
      end

      if LEAD_EVENTS.include?(canonical_event_type)
        attribution.total_leads = attribution.total_leads.to_i + 1
      end
    end
  end
end
