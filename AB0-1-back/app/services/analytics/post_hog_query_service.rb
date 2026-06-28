# app/services/analytics/post_hog_query_service.rb
module Analytics
  class PostHogQueryService
    def self.fetch_company_totals(company_id, days: 30)
      return nil unless enabled?

      # Exemplo de consulta de tendências para uma empresa específica
      # Filtramos por propriedades que enviamos (company_id)
      query = {
        insight: 'TRENDS',
        date_from: "-#{days}d",
        events: [
          { id: 'profile_view', math: 'total' },
          { id: 'whatsapp_click', math: 'total' },
          { id: 'wizard_success', math: 'total' }
        ],
        properties: [
          { key: 'company_id', value: company_id.to_s, operator: 'exact', type: 'event' }
        ]
      }

      execute_query(query)
    end

    def self.execute_query(query)
      uri = URI("#{posthog_host}/api/projects/#{project_id}/insights/trend/")
      req = Net::HTTP::Post.new(uri)
      req['Authorization'] = "Bearer #{personal_api_key}"
      req['Content-Type'] = 'application/json'
      req.body = query.to_json

      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }

      return JSON.parse(res.body) if res.is_a?(Net::HTTPSuccess)

      Rails.logger.error("[PostHogQueryService] Query failed: #{res.code} #{res.body}")
      nil
    rescue StandardError => e
      Rails.logger.error("[PostHogQueryService] Error: #{e.message}")
      nil
    end

    def self.personal_api_key
      ENV.fetch('POSTHOG_PERSONAL_API_KEY', nil)
    end

    def self.project_id
      ENV.fetch('POSTHOG_PROJECT_ID', nil)
    end

    def self.posthog_host
      ENV['POSTHOG_HOST'] || 'https://us.i.posthog.com'
    end

    def self.enabled?
      personal_api_key.present? && project_id.present?
    end
  end
end
