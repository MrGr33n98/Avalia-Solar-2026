module VoiceReviews
  module Config
    module_function

    def enabled?
      return ActiveModel::Type::Boolean.new.cast(ENV['VOICE_REVIEWS_ENABLED']) if ENV['VOICE_REVIEWS_ENABLED'].present?

      !Rails.env.production?
    end

    def frontend_origin
      ENV.fetch('FRONTEND_URL', ENV.fetch('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')).chomp('/')
    end

    def whatsapp_number
      ENV['VOICE_REVIEWS_WHATSAPP_NUMBER'].to_s.gsub(/\D/, '').presence
    end

    def provider
      ENV['VOICE_REVIEWS_PROVIDER'].presence || ENV['VOICE_REVIEWS_GATEWAY'].presence || 'fake'
    end

    def waha_base_url
      ENV.fetch('WAHA_BASE_URL', 'http://waha:3000').chomp('/')
    end

    def waha_session
      ENV.fetch('WAHA_SESSION', 'avalia-solar-voice')
    end

    def waha_api_key
      ENV['WAHA_API_KEY'].presence
    end

    def waha_webhook_hmac_secret
      ENV['WAHA_WEBHOOK_HMAC_SECRET'].presence
    end

    def waha_webhook_max_age_seconds
      Integer(ENV.fetch('WAHA_WEBHOOK_MAX_AGE_SECONDS', '300'), 10)
    rescue ArgumentError
      300
    end

    def meta_app_secret
      ENV['META_APP_SECRET'].presence || ENV['WHATSAPP_APP_SECRET'].presence
    end

    def meta_verify_token
      ENV['META_VERIFY_TOKEN'].presence || ENV['WHATSAPP_VERIFY_TOKEN'].presence
    end

    def contact_pepper
      ENV['VOICE_REVIEWS_CONTACT_PEPPER'].presence || meta_app_secret || waha_webhook_hmac_secret
    end

    def policy_version
      ENV.fetch('VOICE_REVIEWS_POLICY_VERSION', 'voice-reviews-v1')
    end
  end
end
