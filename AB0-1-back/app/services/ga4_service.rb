# frozen_string_literal: true

# app/services/ga4_service.rb
# Google Analytics 4 integration
# - leitura: Analytics Data API (property_id numerico)
# - escrita: Measurement Protocol (measurement_id + api_secret)

class Ga4Service
  MEASUREMENT_API_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
  
  class << self
    # Fetch engagement metrics from GA4 Data API for a specific property
    # @param property_id [String] GA4 Property ID numerico (e.g., "123456789")
    # @param start_date [Date] Start date for metrics
    # @param end_date [Date] End date for metrics
    # @return [Hash] Engagement metrics or nil if failed
    def fetch_engagement_metrics(property_id:, start_date: 30.days.ago.to_date, end_date: Date.current)
      return nil unless ga4_data_api_enabled?
      return nil unless ga4_property_id_valid_for_data_api?(property_id)

      begin
        response = google_analytics_data_client.run_report(
          property: "properties/#{property_id}",
          date_ranges: [{ start_date: start_date.to_s, end_date: end_date.to_s }],
          metrics: [
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'screenPageViewsPerSession' },
            { name: 'engagementRate' }
          ],
          dimensions: []
        )

        parse_engagement_response(response)
      rescue StandardError => e
        Rails.logger.error("[Ga4Service] Failed to fetch engagement metrics: #{e.message}")
        nil
      end
    end

    # Send event to GA4 via Measurement Protocol
    # @param event_name [String] Event name
    # @param properties [Hash] Event properties
    def track(event_name, properties)
      return unless ga4_measurement_enabled?

      payload = build_measurement_payload(event_name, properties)
      
      Thread.new do
        send_to_ga4(payload)
      end
    end

    private

    def ga4_measurement_enabled?
      ENV['GA4_MEASUREMENT_ID'].present? && ENV['GA4_API_SECRET'].present?
    end

    def ga4_data_api_enabled?
      ENV['GA4_SERVICE_ACCOUNT_JSON'].present? || application_default_credentials_available?
    end

    def ga4_property_id_valid_for_data_api?(property_id)
      return true if property_id.to_s.match?(/\A\d+\z/)

      Rails.logger.warn(
        "[Ga4Service] ga4_property_id inválido para Data API: #{property_id.inspect}. Esperado um Property ID numérico."
      )
      false
    end

    def google_analytics_data_client
      require 'google/analytics/data/v1beta'
      
      @client ||= Google::Analytics::Data::V1beta::AnalyticsData::Client.new do |config|
        config.credentials = ga4_credentials
      end
    end

    def ga4_credentials
      # Option 1: Service Account JSON file
      if ENV['GA4_SERVICE_ACCOUNT_JSON'].present?
        require 'google/apis/analyticsdata_v1beta'
        require 'googleauth'
        
        Google::Auth::ServiceAccountCredentials.make_creds(
          json_key_io: StringIO.new(ENV['GA4_SERVICE_ACCOUNT_JSON']),
          scope: 'https://www.googleapis.com/auth/analytics.readonly'
        )
      # Option 2: Application Default Credentials (GCP)
      else
        require 'googleauth'
        Google::Auth.get_application_default(['https://www.googleapis.com/auth/analytics.readonly'])
      end
    end

    def application_default_credentials_available?
      ENV['GOOGLE_APPLICATION_CREDENTIALS'].present? || ENV['GOOGLE_CLOUD_PROJECT'].present?
    end

    def parse_engagement_response(response)
      return nil if response.rows.empty?

      row = response.rows.first
      metrics = row.metric_values

      {
        avg_time_on_page_seconds: metrics[0].value.to_f.round(0),
        bounce_rate_percent: (metrics[1].value.to_f * 100).round(2),
        pages_per_session: metrics[2].value.to_f.round(2),
        engagement_rate_percent: (metrics[3].value.to_f * 100).round(2)
      }
    rescue StandardError => e
      Rails.logger.error("[Ga4Service] Failed to parse response: #{e.message}")
      nil
    end

    # Build Measurement Protocol payload
    def build_measurement_payload(event_name, properties)
      {
        client_id: generate_client_id(properties),
        events: [
          {
            name: sanitize_event_name(event_name),
            params: sanitize_params(properties)
          }
        ]
      }
    end

    def send_to_ga4(payload)
      uri = URI(MEASUREMENT_API_ENDPOINT)
      uri.query = URI.encode_www_form({
        measurement_id: ENV['GA4_MEASUREMENT_ID'],
        api_secret: ENV['GA4_API_SECRET']
      })

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 5
      http.open_timeout = 5

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request.body = payload.to_json

      response = http.request(request)

      unless response.code == '204'
        Rails.logger.warn("[Ga4Service] GA4 returned non-204: #{response.code}")
      end
    rescue StandardError => e
      Rails.logger.error("[Ga4Service] Failed to send to GA4: #{e.message}")
    end

    def generate_client_id(properties)
      # Use user_id if available, otherwise generate from IP + User-Agent
      properties[:user_id]&.to_s ||
        Digest::SHA256.hexdigest("#{properties[:ip_address]}#{properties[:user_agent]}")[0..15]
    end

    def sanitize_event_name(name)
      # GA4 event names: max 40 chars, alphanumeric + underscore
      name.to_s.gsub(/[^a-zA-Z0-9_]/, '_').downcase[0..39]
    end

    def sanitize_params(params)
      # Remove nil values, limit string length
      params.compact.transform_values do |value|
        value.is_a?(String) ? value[0..99] : value
      end
    end
  end
end
