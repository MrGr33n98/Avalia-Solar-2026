require 'base64'

module VoiceReviews
  module SpeechToText
    class ConfigurationError < StandardError; end

    class Fake
      def transcribe(_asset)
        { text: ENV.fetch('VOICE_REVIEWS_FAKE_TRANSCRIPT', 'O atendimento foi bom, mas o prazo poderia melhorar.'),
          language: 'pt-BR', provider: 'fake', model_id: 'fake-pt-br-v1' }
      end

      def transcribe_bytes(bytes:, mime_type:)
        transcribe(nil)
      end
    end

    class Http
      def transcribe(asset)
        raise ConfigurationError, 'Arquivo de áudio ausente' unless asset&.file&.attached?

        transcribe_bytes(bytes: asset.file.download, mime_type: asset.mime_type)
      end

      def transcribe_bytes(bytes:, mime_type:)
        url = ENV['VOICE_REVIEWS_STT_URL'].presence
        raise ConfigurationError, 'VOICE_REVIEWS_STT_URL ausente' if url.blank? || bytes.blank?

        response = HTTParty.post(url, headers: headers, body: {
          audio_base64: Base64.strict_encode64(bytes), mime_type: mime_type, language_hint: 'pt-BR'
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

    class OpenRouter
      MODEL_ID = 'google/gemini-2.0-flash-001'.freeze

      def transcribe(asset)
        raise ConfigurationError, 'Arquivo de áudio ausente' unless asset&.file&.attached?

        transcribe_bytes(bytes: asset.file.download, mime_type: asset.mime_type)
      end

      def transcribe_bytes(bytes:, mime_type:)
        api_key = ENV['OPENROUTER_API_KEY'].presence || ENV['AI_API_KEY'].presence
        return Fake.new.transcribe(nil) if api_key.blank? || bytes.blank?

        response = HTTParty.post(
          "#{ENV.fetch('AI_BASE_URL', 'https://openrouter.ai/api/v1').sub(%r{/+\z}, '')}/chat/completions",
          headers: { 'Authorization' => "Bearer #{api_key}", 'Content-Type' => 'application/json' },
          body: request_body(bytes, mime_type).to_json, timeout: 25
        )
        text = response.parsed_response.dig('choices', 0, 'message', 'content').to_s.strip if response.success?
        return Fake.new.transcribe(nil) if text.blank?

        { text: text, language: 'pt-BR', provider: 'openrouter', model_id: MODEL_ID }
      rescue StandardError => e
        Rails.logger.warn("[VoiceReviews][OpenRouterSTT] fallback after #{e.class}: #{e.message}")
        Fake.new.transcribe(nil)
      end

      private

      def request_body(bytes, mime_type)
        prompt = 'Transcreva exatamente em português do Brasil o que foi falado neste áudio de avaliação de ' \
                 'energia solar. Retorne apenas a transcrição limpa, sem comentários adicionais.'
        audio_part = { data: Base64.strict_encode64(bytes), format: audio_format(mime_type) }
        { model: MODEL_ID, temperature: 0.0, max_tokens: 500, messages: [{
          role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'input_audio', input_audio: audio_part }
          ]
        }] }
      end

      def audio_format(mime_type)
        raw = mime_type.to_s.downcase
        return 'mp3' if raw.include?('mp3') || raw.include?('mpeg')
        return 'wav' if raw.include?('wav')
        return 'm4a' if raw.include?('mp4') || raw.include?('m4a')

        'ogg'
      end
    end

    module_function

    def provider
      name = ENV.fetch('VOICE_REVIEWS_STT_PROVIDER', 'auto')
      return Fake.new if Rails.env.test? && name == 'auto'
      return Fake.new if name == 'fake'
      return Http.new if name == 'http'
      return OpenRouter.new if name == 'openrouter'
      return Http.new if name == 'auto' && ENV['VOICE_REVIEWS_STT_URL'].present?
      return OpenRouter.new if name == 'auto' && (ENV['OPENROUTER_API_KEY'].present? || ENV['AI_API_KEY'].present?)

      Fake.new
    end
  end
end
