# frozen_string_literal: true

module CompanyDashboard
  class TagHealthMonitorService
    def self.call(company:)
      new(company:).call
    end

    def initialize(company:)
      @company = company
    end

    def call
      site = ::Sales::TrackingSite.find_by(company_id: @company.id)
      return uninstalled_status unless site

      last_event_at = ::Sales::TrackingEvent.where(company_id: @company.id).maximum(:occurred_at)
      last_session_at = ::Sales::TrackingSession.where(company_id: @company.id).maximum(:started_at)
      last_telemetry_at = [last_event_at, last_session_at].compact.max

      events_24h = ::Sales::TrackingEvent.where(company_id: @company.id, occurred_at: 24.hours.ago..Time.current).count
      events_7d = ::Sales::TrackingEvent.where(company_id: @company.id, occurred_at: 7.days.ago..Time.current).count
      sessions_7d = ::Sales::TrackingSession.where(company_id: @company.id, started_at: 7.days.ago..Time.current).count

      consented_sessions_7d = ::Sales::TrackingSession.where(
        company_id: @company.id,
        started_at: 7.days.ago..Time.current,
        consent_state: 'granted'
      ).count

      consent_grant_rate = sessions_7d.positive? ? (consented_sessions_7d.to_f / sessions_7d * 100).round(1) : nil

      observed_hosts = ::Sales::TrackingSession.where(company_id: @company.id)
                                               .where.not(referrer_host: nil)
                                               .distinct
                                               .limit(20)
                                               .pluck(:referrer_host)

      health_status = resolve_health(site, last_telemetry_at)

      {
        configured: true,
        active: site.active,
        status: health_status,
        public_key: site.public_key,
        allowed_origins: site.allowed_origins || [],
        validated_https_origins: (site.allowed_origins || []).all? { |o| o.start_with?('https://') || o.start_with?('http://localhost') },
        last_telemetry_at: last_telemetry_at&.iso8601,
        events_last_24h: events_24h,
        events_last_7d: events_7d,
        sessions_last_7d: sessions_7d,
        consent_grant_rate: consent_grant_rate,
        observed_referrer_hosts: observed_hosts,
        settings: site.settings || {}
      }
    end

    private

    def uninstalled_status
      {
        configured: false,
        active: false,
        status: 'tag_not_installed',
        public_key: nil,
        allowed_origins: [],
        validated_https_origins: false,
        last_telemetry_at: nil,
        events_last_24h: 0,
        events_last_7d: 0,
        sessions_last_7d: 0,
        consent_grant_rate: nil,
        observed_referrer_hosts: [],
        settings: {}
      }
    end

    def resolve_health(site, last_telemetry_at)
      return 'inactive' unless site.active
      return 'configured_no_evidence' if last_telemetry_at.nil?
      return 'possibly_inactive' if last_telemetry_at < 7.days.ago

      'healthy'
    end
  end
end
