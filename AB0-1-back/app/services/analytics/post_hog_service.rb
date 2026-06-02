# app/services/analytics/post_hog_service.rb
module Analytics
  class PostHogService
    def self.capture(event_name, properties = {}, distinct_id: nil)
      return unless enabled?

      distinct_id = opaque_distinct_id(distinct_id || properties[:distinct_id] || 'anonymous')
      
      # Sanitize properties (remove PII)
      sanitized_props = sanitize_properties(properties)
      
      # Adiciona contexto do Rails (ambiente)
      sanitized_props[:rails_env] = Rails.env
      sanitized_props[:$lib] = 'ruby-service'

      begin
        posthog.capture(
          distinct_id: distinct_id,
          event: event_name,
          properties: sanitized_props
        )
      rescue StandardError => e
        Rails.logger.error("[PostHogService] Error capturing event #{event_name}: #{e.message}")
      end
    end

    def self.identify(distinct_id:, properties: {})
      return unless enabled?

      posthog.identify(
        distinct_id: opaque_distinct_id(distinct_id),
        properties: sanitize_properties(properties)
      )
    rescue StandardError => e
      Rails.logger.error("[PostHogService] Error identifying user: #{e.message}")
    end

    def self.track_lead(lead)
      return unless lead

      properties = {
        lead_id: lead.id,
        company_id: lead.company_id,
        item_id: lead.company_id, # VAR-014
        company_name: lead.company&.name,
        item_name: lead.company&.name, # VAR-015
        category: lead.product_vertical,
        item_category: lead.product_vertical, # VAR-016
        status: lead.status,
        created_at: lead.created_at,
        "$set" => {
          last_lead_at: lead.created_at
        }
      }

      capture('wizard_success', properties, distinct_id: "lead_#{lead.id}")
    end

    def self.track_company_view(company, user)
      return unless company && user

      properties = {
        company_id: company.id,
        company_name: company.name,
        user_role: user.role
      }

      capture('company_profile_view', properties, distinct_id: user.id.to_s)
    end

    # Dispara um evento crítico do lado do servidor (evita AdBlockers)
    # @param event_name [String] Nome do evento (deve seguir o schema)
    # @param identity_id [String, Integer] ID do usuário ou lead
    # @param properties [Hash] Propriedades adicionais do evento
    def self.track_server_event(event_name, identity_id, properties = {})
      return unless event_name && identity_id

      # Garante que o distinct_id segue o padrão (user_id ou lead_id)
      d_id = if identity_id.is_a?(Integer) || identity_id.to_s.match?(/\A\d+\z/)
               "user_#{identity_id}"
             else
               identity_id.to_s
             end

      properties[:$os] = 'Linux (Server)'
      properties[:is_server_side] = true

      capture(event_name, properties, distinct_id: d_id)
    end

    private

    def self.posthog
      @posthog ||= PostHog::Client.new(
        api_key: ENV['POSTHOG_API_KEY'] || ENV['NEXT_PUBLIC_POSTHOG_KEY'],
        api_host: ENV['POSTHOG_HOST'] || 'https://us.i.posthog.com'
      )
    end

    def self.enabled?
      (ENV['POSTHOG_API_KEY'].present? || ENV['NEXT_PUBLIC_POSTHOG_KEY'].present?) && !Rails.env.test?
    end

    def self.sanitize_properties(props)
      Analytics::LgpdAnonymizer.new(props).anonymize.deep_symbolize_keys
    end

    def self.opaque_distinct_id(distinct_id)
      raw = distinct_id.to_s
      return raw if raw.match?(/\A(user|lead|company|anon)[_-]/)
      return "user_#{raw}" if raw.match?(/\A\d+\z/)

      raw
    end
  end
end
