require 'base64'
require 'open3'

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
        raise ConfigurationError, 'Arquivo de áudio ausente' unless asset&.audio_attached?

        transcribe_bytes(bytes: asset.download_audio_bytes, mime_type: asset.mime_type)
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

    class GoogleSpeech
      ENDPOINT = 'http://www.google.com/speech-api/v2/recognize'.freeze
      DEFAULT_KEY = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw'.freeze

      def transcribe(asset)
        raise ConfigurationError, 'Arquivo de áudio ausente' unless asset&.audio_attached?

        transcribe_bytes(bytes: asset.download_audio_bytes, mime_type: asset.mime_type)
      end

      def transcribe_bytes(bytes:, mime_type: nil)
        return Fake.new.transcribe(nil) if bytes.blank?

        flac_bytes = convert_to_flac(bytes)
        return Fake.new.transcribe(nil) if flac_bytes.blank?

        text = request_transcript(flac_bytes)
        return Fake.new.transcribe(nil) if text.blank?

        { text: text, language: 'pt-BR', provider: 'google_speech', model_id: 'chromium-speech-v2-pt-br' }
      rescue StandardError => e
        Rails.logger.warn("[VoiceReviews][GoogleSpeechSTT] fallback after #{e.class}: #{e.message}")
        Fake.new.transcribe(nil)
      end

      private

      def convert_to_flac(bytes)
        cmd = %w[ffmpeg -nostdin -loglevel error -i pipe:0 -ar 16000 -ac 1 -sample_fmt s16 -f flac pipe:1]
        stdout, _stderr, status = Open3.capture3(*cmd, binmode: true, stdin_data: bytes)
        status.success? ? stdout : nil
      end

      def request_transcript(flac_bytes)
        key = ENV.fetch('GOOGLE_SPEECH_API_KEY', DEFAULT_KEY)
        url = "#{ENDPOINT}?client=chromium&lang=pt-BR&key=#{key}&pFilter=0"
        response = HTTParty.post(
          url, headers: { 'Content-Type' => 'audio/x-flac; rate=16000' }, body: flac_bytes, timeout: 25
        )
        return nil unless response.success?

        parse_response_lines(response.body.to_s)
      end

      def parse_response_lines(raw_body)
        raw_body.each_line do |line|
          next if line.strip.blank?

          parsed = JSON.parse(line)
          alts = parsed.dig('result', 0, 'alternative')
          next unless alts.is_a?(Array) && alts.any?

          best = alts.max_by { |a| a['confidence'].to_f } || alts.first
          return best['transcript'].to_s.strip if best['transcript'].present?
        end
        nil
      end
    end

    class OpenRouter
      MODEL_ID = 'google/gemini-2.5-flash-lite'.freeze

      def transcribe(asset)
        raise ConfigurationError, 'Arquivo de áudio ausente' unless asset&.audio_attached?

        transcribe_bytes(bytes: asset.download_audio_bytes, mime_type: asset.mime_type)
      end

      def transcribe_bytes(bytes:, mime_type:)
        api_key = ENV['OPENROUTER_API_KEY'].presence || ENV['AI_API_KEY'].presence
        return GoogleSpeech.new.transcribe_bytes(bytes: bytes, mime_type: mime_type) if api_key.blank? || bytes.blank?

        response = post_openrouter(api_key, bytes, mime_type)
        text = response.parsed_response.dig('choices', 0, 'message', 'content').to_s.strip if response.success?
        return { text: text, language: 'pt-BR', provider: 'openrouter', model_id: MODEL_ID } if text.present?

        Rails.logger.warn("[VoiceReviews][OpenRouterSTT] HTTP #{response.code}, falling back to GoogleSpeech")
        GoogleSpeech.new.transcribe_bytes(bytes: bytes, mime_type: mime_type)
      rescue StandardError => e
        Rails.logger.warn("[VoiceReviews][OpenRouterSTT] fallback after #{e.class}: #{e.message}")
        GoogleSpeech.new.transcribe_bytes(bytes: bytes, mime_type: mime_type)
      end

      private

      def post_openrouter(api_key, bytes, mime_type)
        HTTParty.post(
          "#{ENV.fetch('AI_BASE_URL', 'https://openrouter.ai/api/v1').sub(%r{/+\z}, '')}/chat/completions",
          headers: { 'Authorization' => "Bearer #{api_key}", 'Content-Type' => 'application/json' },
          body: request_body(bytes, mime_type).to_json, timeout: 25
        )
      end

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
      return Fake.new if (Rails.env.test? && name == 'auto') || name == 'fake'
      return Http.new if name == 'http' || (name == 'auto' && ENV['VOICE_REVIEWS_STT_URL'].present?)
      return GoogleSpeech.new if name == 'google'
      return OpenRouter.new if name == 'openrouter' || (name == 'auto' && openrouter_configured?)

      GoogleSpeech.new
    end

    def openrouter_configured?
      ENV['OPENROUTER_API_KEY'].present? || ENV['AI_API_KEY'].present?
    end
  end
end
