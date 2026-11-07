require 'base64'

module VoiceReviews
  module SpeechToText
    class Fake
      def transcribe(_asset)
        { text: ENV.fetch('VOICE_REVIEWS_FAKE_TRANSCRIPT', 'O atendimento foi bom, mas o prazo poderia melhorar.'),
          language: 'pt-BR', provider: 'fake', model_id: 'fake-pt-br-v1' }
      end
    end

    class ConfigurationError < StandardError; end

    class Http
      def transcribe(asset)
        url = ENV['VOICE_REVIEWS_STT_URL'].presence
        raise ConfigurationError, 'VOICE_REVIEWS_STT_URL ausente' if url.blank? || !asset.file.attached?

        response = HTTParty.post(url, headers: headers, body: {
          audio_base64: Base64.strict_encode64(asset.file.download), mime_type: asset.mime_type, language_hint: 'pt-BR'
        }.to_json)
        raise "Falha no provedor STT (#{response.code})" unless response.success?

        body = response.parsed_response
        raise 'Resposta STT sem texto' unless body.is_a?(Hash) && body['text'].to_s.present?

        { text: body['text'].to_s, language: body['language'].presence || 'pt-BR', provider: 'http',
          model_id: body['model_id'].presence || 'configured-http' }
      end

      private

      def headers
        { 'Content-Type' => 'application/json' }.tap do |value|
          value['Authorization'] = "Bearer #{ENV['VOICE_REVIEWS_STT_TOKEN']}" if ENV['VOICE_REVIEWS_STT_TOKEN'].present?
        end
      end
    end

    module_function

    def provider
      name = ENV.fetch('VOICE_REVIEWS_STT_PROVIDER', Rails.env.production? ? 'unconfigured' : 'fake')
      return Fake.new if name == 'fake' && !Rails.env.production?
      return Http.new if name == 'http'

      raise ConfigurationError, "STT provider '#{name}' não configurado com adapter de produção"
    end
  end
end
