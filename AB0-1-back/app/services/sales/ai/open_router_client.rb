require 'net/http'
require 'json'
require 'uri'

module Sales
  module Ai
    class OpenRouterClient
      BASE_URL = 'https://openrouter.ai/api/v1'.freeze
      DEFAULT_TIMEOUT_SECONDS = 25
      CONNECT_TIMEOUT_SECONDS = 8
      REFERER_URL = 'https://crm.avaliasolar.com.br'.freeze
      APP_TITLE = 'Avalia Solar CRM'.freeze

      class ClientError < StandardError
        attr_reader :code, :http_status, :retryable

        def initialize(message, code: 'OPENROUTER_UPSTREAM_ERROR', http_status: :bad_gateway, retryable: false)
          super(message)
          @code = code
          @http_status = http_status
          @retryable = retryable
        end

        def retryable?
          @retryable
        end
      end

      def initialize(api_key:, base_url: nil, timeout_seconds: DEFAULT_TIMEOUT_SECONDS)
        @api_key = api_key.to_s.strip
        @base_url = (base_url.presence || ENV['SALES_OPENROUTER_BASE_URL'].presence || BASE_URL).sub(%r{/+\z}, '')
        @timeout_seconds = timeout_seconds
      end

      def chat!(model_id:, messages:, temperature: 0.25, max_tokens: 900, require_zdr: false)
        validate_key_present!

        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        uri = URI.parse("#{@base_url}/chat/completions")

        payload = {
          model: model_id,
          messages: messages,
          temperature: temperature.to_f,
          max_tokens: max_tokens.to_i,
          response_format: { type: 'json_object' }
        }

        if require_zdr
          payload[:provider] = {
            data_collection: 'deny'
          }
        end

        response = perform_post!(uri, payload)
        elapsed_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round

        parsed = parse_json_body(response.body)
        content = parsed.dig('choices', 0, 'message', 'content').to_s

        if content.blank?
          raise ClientError.new(
            'OpenRouter retornou resposta vazia do modelo.',
            code: 'OPENROUTER_EMPTY_RESPONSE',
            http_status: :bad_gateway,
            retryable: true
          )
        end

        usage = parsed['usage'].is_a?(Hash) ? parsed['usage'] : {}

        {
          content: content,
          resolved_model: parsed['model'].presence || model_id,
          prompt_tokens: usage['prompt_tokens'].to_i,
          completion_tokens: usage['completion_tokens'].to_i,
          latency_ms: elapsed_ms,
          provider_request_id: parsed['id'].to_s
        }
      end

      def test_connection!(model_id: 'openai/gpt-4o-mini')
        validate_key_present!

        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        uri = URI.parse("#{@base_url}/chat/completions")

        payload = {
          model: model_id,
          messages: [
            { role: 'system', content: 'Responda apenas com JSON {"ok":true}.' },
            { role: 'user', content: 'ping' }
          ],
          temperature: 0.0,
          max_tokens: 16
        }

        response = perform_post!(uri, payload)
        elapsed_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round
        parsed = parse_json_body(response.body)

        {
          status: 'ok',
          latency_ms: elapsed_ms,
          model_id: parsed['model'].presence || model_id
        }
      end

      private

      def validate_key_present!
        return if @api_key.present?

        raise ClientError.new(
          'Chave OpenRouter não configurada. Configure em Settings -> AI Models.',
          code: 'OPENROUTER_KEY_MISSING',
          http_status: :unprocessable_entity,
          retryable: false
        )
      end

      def perform_post!(uri, payload)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = (uri.scheme == 'https')
        http.open_timeout = CONNECT_TIMEOUT_SECONDS
        http.read_timeout = @timeout_seconds

        request = Net::HTTP::Post.new(uri.request_uri)
        request['Content-Type'] = 'application/json'
        request['Authorization'] = "Bearer #{@api_key}"
        request['HTTP-Referer'] = REFERER_URL
        request['X-Title'] = APP_TITLE
        request.body = JSON.generate(payload)

        response = http.request(request)
        handle_http_errors!(response)
        response
      rescue Net::OpenTimeout, Net::ReadTimeout, Timeout::Error
        raise ClientError.new(
          'Tempo limite excedido ao aguardar resposta do OpenRouter.',
          code: 'OPENROUTER_TIMEOUT',
          http_status: :gateway_timeout,
          retryable: true
        )
      rescue SocketError, Errno::ECONNREFUSED, Errno::ECONNRESET, OpenSSL::SSL::SSLError => e
        raise ClientError.new(
          "Falha de rede ao conectar ao OpenRouter (#{e.class.name}).",
          code: 'OPENROUTER_NETWORK_ERROR',
          http_status: :bad_gateway,
          retryable: true
        )
      end

      def handle_http_errors!(response)
        status = response.code.to_i
        return if status.between?(200, 299)

        error_detail = extract_safe_error_message(response.body)

        case status
        when 401, 403
          raise ClientError.new(
            "Credencial OpenRouter inválida ou revogada (#{error_detail}).",
            code: 'OPENROUTER_UNAUTHORIZED',
            http_status: :unprocessable_entity,
            retryable: false
          )
        when 402
          raise ClientError.new(
            "Créditos insuficientes na conta OpenRouter (#{error_detail}).",
            code: 'OPENROUTER_INSUFFICIENT_CREDITS',
            http_status: :payment_required,
            retryable: false
          )
        when 429
          raise ClientError.new(
            "Limite de requisições (rate limit) atingido no OpenRouter (#{error_detail}).",
            code: 'OPENROUTER_RATE_LIMITED',
            http_status: :too_many_requests,
            retryable: true
          )
        when 500..599
          raise ClientError.new(
            "Indisponibilidade temporária no provedor OpenRouter (HTTP #{status}).",
            code: 'OPENROUTER_UPSTREAM_ERROR',
            http_status: :bad_gateway,
            retryable: true
          )
        else
          raise ClientError.new(
            "Erro retornado pelo OpenRouter (HTTP #{status}: #{error_detail}).",
            code: 'OPENROUTER_BAD_REQUEST',
            http_status: :bad_gateway,
            retryable: false
          )
        end
      end

      def extract_safe_error_message(raw_body)
        parsed = JSON.parse(raw_body.to_s)
        msg = parsed.dig('error', 'message') || parsed['message'] || 'erro desconhecido'
        sanitize_sensitive_tokens(msg.to_s).truncate(180)
      rescue JSON::ParserError
        'resposta não estruturada do gateway'
      end

      def sanitize_sensitive_tokens(text)
        text.gsub(/sk-or-v1-[A-Za-z0-9_-]+/, '[REDACTED_KEY]')
            .gsub(/Bearer\s+[A-Za-z0-9._-]+/i, 'Bearer [REDACTED]')
      end

      def parse_json_body(raw_body)
        JSON.parse(raw_body.to_s)
      rescue JSON::ParserError
        raise ClientError.new(
          'OpenRouter retornou JSON malformado.',
          code: 'OPENROUTER_INVALID_JSON',
          http_status: :bad_gateway,
          retryable: true
        )
      end
    end
  end
end

