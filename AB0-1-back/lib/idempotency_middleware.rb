# frozen_string_literal: true

# Middleware para garantir idempotência em requests críticas
# Uso: Adicione o header 'Idempotency-Key' nas requisições
class IdempotencyMiddleware
  IDEMPOTENT_METHODS = %w[POST PATCH PUT DELETE].freeze
  CACHE_EXPIRY = 24.hours
  CRITICAL_ENDPOINTS = [
    %r{/api/v1/leads},
    %r{/api/v1/orders},
    %r{/api/v1/products},
    %r{/api/v1/pending_changes},
    %r{/api/v1/billing/checkout},
    %r{/api/v1/company_dashboard/banner_checkout},
    %r{/api/v1/payments/webhooks}
  ].freeze

  def initialize(app)
    @app = app
  end

  def call(env)
    # Otimização: Ignora verificação para métodos não-idempotentes (GET, HEAD, OPTIONS)
    # Isso evita criar ActionDispatch::Request para requests de assets/imagens (ActiveStorage)
    # que são muito frequentes e causavam overhead desnecessário.
    return @app.call(env) unless IDEMPOTENT_METHODS.include?(env['REQUEST_METHOD'])

    request = ActionDispatch::Request.new(env)

    # Verifica se a requisição precisa de idempotência
    return @app.call(env) unless requires_idempotency?(request)

    idempotency_key = request.headers['Idempotency-Key'] || request.headers['HTTP_IDEMPOTENCY_KEY']

    # Se não tem chave de idempotência, processa normalmente
    return @app.call(env) if idempotency_key.blank?

    # Valida o formato da chave
    unless valid_idempotency_key?(idempotency_key)
      return error_response('Invalid Idempotency-Key format. Use UUID or unique string.')
    end

    cache_key = build_cache_key(request, idempotency_key)

    # Tenta recuperar resposta em cache
    cached_response = Rails.cache.read(cache_key)
    return build_response_from_cache(cached_response) if cached_response

    # Adquire lock para evitar processamento duplicado
    lock_key = "#{cache_key}:lock"
    if Rails.cache.exist?(lock_key)
      # Request duplicada ainda em processamento
      return error_response('Request already in progress', 409)
    end

    # Define o lock
    Rails.cache.write(lock_key, true, expires_in: 5.minutes)

    begin
      # Processa a requisição
      status, headers, body = @app.call(env)

      # Armazena a resposta se foi sucesso (2xx)
      if status >= 200 && status < 300
        response_data = {
          status: status,
          headers: headers.to_h,
          body: extract_body(body)
        }
        Rails.cache.write(cache_key, response_data, expires_in: CACHE_EXPIRY)
      end

      [status, headers, body]
    ensure
      # Remove o lock
      Rails.cache.delete(lock_key)
    end
  end

  private

  def requires_idempotency?(request)
    return false unless IDEMPOTENT_METHODS.include?(request.request_method)

    CRITICAL_ENDPOINTS.any? { |pattern| pattern.match?(request.path) }
  end

  def valid_idempotency_key?(key)
    # Aceita UUID ou string alfanumérica de 16-64 caracteres
    key.match?(/\A[a-zA-Z0-9\-_]{16,64}\z/)
  end

  def build_cache_key(request, idempotency_key)
    user_id = extract_user_id(request)
    "idempotency:#{user_id}:#{request.path}:#{idempotency_key}"
  end

  def extract_user_id(request)
    # Tenta extrair o user_id do JWT token
    token = request.headers['Authorization']&.split&.last
    return 'anonymous' if token.blank?

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
      decoded[0]['user_id'] || 'unknown'
    rescue JWT::DecodeError
      'invalid_token'
    end
  end

  def extract_body(response_body)
    body_content = response_body.map { |part| part }
    body_content.join
  end

  def build_response_from_cache(cached_data)
    [
      cached_data[:status],
      cached_data[:headers].merge('X-Idempotent-Replay' => 'true'),
      [cached_data[:body]]
    ]
  end

  def error_response(message, status = 400)
    [
      status,
      { 'Content-Type' => 'application/json' },
      [{ error: message }.to_json]
    ]
  end
end
