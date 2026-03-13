# app/services/analytics/post_hog_service.rb
module Analytics
  class PostHogService
    def self.capture(event_name, properties = {}, distinct_id: nil)
      return unless enabled?

      distinct_id ||= properties[:distinct_id] || 'anonymous'
      
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

    def self.track_lead(lead)
      return unless lead

      properties = {
        lead_id: lead.id,
        company_id: lead.company_id,
        company_name: lead.company&.name,
        category: lead.category,
        product_vertical: lead.product_vertical,
        status: lead.status,
        created_at: lead.created_at,
        $set: {
          last_lead_at: lead.created_at
        }
      }

      capture('lead_generated', properties, distinct_id: lead.email)
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
      pii_keys = %i[email phone name cnpj cpf password token secret]
      props.except(*pii_keys)
    end
  end
end
