module Analytics
  class LgpdAnonymizer
    PII_KEYS = %w[email phone cellphone cpf cnpj ip_address ip address name].freeze

    def initialize(payload)
      @payload = payload.deep_stringify_keys
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
        if PII_KEYS.include?(key.downcase)
          result[key] = '[REDACTED]'
        elsif value.is_a?(Hash)
          result[key] = deep_redact(value)
        elsif value.is_a?(Array)
          result[key] = value.map { |v| v.is_a?(Hash) ? deep_redact(v) : v }
        else
          result[key] = value
        end
      end
    end

    def hash_identity(id)
      # Rotacionamento de salt por mês para limitar o rastreio contínuo (LGPD Minimization)
      # Ao mesmo tempo que permite cohort analysis no mesmo mês.
      salt = "#{Rails.application.credentials.secret_key_base}_#{Time.current.strftime('%Y_%m')}"
      Digest::SHA256.hexdigest("#{id}-#{salt}")
    end
  end
end
