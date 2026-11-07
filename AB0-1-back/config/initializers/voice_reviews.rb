if Rails.env.production? && ActiveModel::Type::Boolean.new.cast(ENV.fetch('VOICE_REVIEWS_ENABLED', 'false'))
  required = %w[VOICE_REVIEWS_BUCKET]
  unless %w[meta waha].include?(VoiceReviews::Config.provider)
    raise 'VOICE_REVIEWS_PROVIDER deve ser meta ou waha em produção'
  end
  required.concat(%w[META_APP_SECRET META_VERIFY_TOKEN META_PHONE_NUMBER_ID META_ACCESS_TOKEN]) if VoiceReviews::Config.provider == 'meta'
  required.concat(%w[WAHA_BASE_URL WAHA_API_KEY WAHA_WEBHOOK_HMAC_SECRET WAHA_SESSION]) if VoiceReviews::Config.provider == 'waha'
  missing = required.select { |key| ENV[key].blank? }
  missing << 'VOICE_REVIEWS_STT_URL' if ENV.fetch('VOICE_REVIEWS_STT_PROVIDER', 'http') == 'http' && ENV['VOICE_REVIEWS_STT_URL'].blank?
  raise "Voice Reviews exige configuração privada completa: #{missing.join(', ')}" if missing.any?
end
