# frozen_string_literal: true

Rails.application.config.after_initialize do
  if Rails.env.production? && ActiveModel::Type::Boolean.new.cast(ENV.fetch('VOICE_REVIEWS_ENABLED', 'false'))
    provider = ENV['VOICE_REVIEWS_PROVIDER'].presence || ENV['VOICE_REVIEWS_GATEWAY'].presence || 'fake'
    unless %w[meta waha].include?(provider)
      Rails.logger.warn("[VoiceReviews] VOICE_REVIEWS_PROVIDER deve ser meta ou waha em produção (atual: #{provider})")
    end

    required = %w[VOICE_REVIEWS_BUCKET]
    required.concat(%w[META_APP_SECRET META_VERIFY_TOKEN META_PHONE_NUMBER_ID META_ACCESS_TOKEN]) if provider == 'meta'
    required.concat(%w[WAHA_BASE_URL WAHA_API_KEY WAHA_WEBHOOK_HMAC_SECRET WAHA_SESSION]) if provider == 'waha'
    missing = required.select { |key| ENV[key].blank? }
    missing << 'VOICE_REVIEWS_STT_URL' if ENV.fetch('VOICE_REVIEWS_STT_PROVIDER', 'http') == 'http' && ENV['VOICE_REVIEWS_STT_URL'].blank?

    if missing.any?
      Rails.logger.warn("[VoiceReviews] Configuração parcial em produção (chaves pendentes: #{missing.join(', ')})")
    else
      Rails.logger.info("[VoiceReviews] Voice Reviews configurado com sucesso (provedor: #{provider})")
    end
  end
end
