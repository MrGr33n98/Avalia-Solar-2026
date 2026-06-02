module Analytics
  class LgpdAnonymizer
    BLOCKED_KEYS = %w[
      address address_full author_name cellphone city client_name cnpj company_name contact_email
      contact_name content cpf description email email_address emailaddress faq_question
      first_name full_address full_name ip ip_address item_name last_name message name
      page_name page_title password phone phone_number phonenumber previous_term product_name
      query reviewer_name search_term secret summary tab_label token whatsapp zipcode
    ].freeze
    URL_KEYS = %w[$current_url page_url referrer].freeze

    def initialize(payload)
      @payload = payload.is_a?(Hash) ? payload.deep_stringify_keys : {}
    end

    def anonymize
      anonymized_payload = deep_redact(@payload)
      
      if anonymized_payload['user_id'].present?
        anonymized_payload['user_id'] = hash_identity(anonymized_payload['user_id'])
      end

      anonymized_payload
    end

    private

    def deep_redact(hash)
      hash.each_with_object({}) do |(key, value), result|
        if BLOCKED_KEYS.include?(key.downcase)
          next
        elsif URL_KEYS.include?(key.downcase)
          result[key] = sanitize_url(value)
        elsif value.is_a?(Hash)
          result[key] = deep_redact(value)
        elsif value.is_a?(Array)
          result[key] = value.map { |item| deep_redact_value(item) }
        else
          result[key] = value
        end
      end
    end

    def deep_redact_value(value)
      return deep_redact(value) if value.is_a?(Hash)
      return value.map { |item| deep_redact_value(item) } if value.is_a?(Array)

      value
    end

    def sanitize_url(value)
      value.is_a?(String) ? value.split(/[?#]/).first : value
    end

    def hash_identity(id)
      return nil if id.blank?
      
      # Rotacionamento de salt por mês para limitar o rastreio contínuo (LGPD Minimization)
      # Usamos secret_key_base que tem fallback para env var em produção.
      base_secret = begin
        Rails.application.secret_key_base.presence || 
        Rails.application.credentials.secret_key_base.presence
      rescue StandardError
        nil
      end || 'fallback_for_anonymization'
      
      salt = "#{base_secret}_#{Time.current.strftime('%Y_%m')}"
      Digest::SHA256.hexdigest("#{id}-#{salt}")
    end
  end
end
