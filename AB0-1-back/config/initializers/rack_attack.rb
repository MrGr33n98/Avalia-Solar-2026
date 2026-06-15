# frozen_string_literal: true

# Configuração do Rack::Attack para rate limiting
# Implementado em: TASK-001
# Documentação: https://github.com/rack/rack-attack

class Rack::Attack
  ### Configuração de Cache ###
  # Migrado para Redis (Fase 1)
  Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/2'),
    namespace: 'avaliasolar:rack_attack'
  )

  ### Throttle Configurations ###

  # === Fase 1: Banner Events Tracking Protection ===
  
  # Limite: 100 requests por minuto por IP em banner_events
  # Previne spam de eventos falsos
  throttle('banner_events/ip', limit: 100, period: 1.minute) do |req|
    if req.path == '/api/v1/banner_events' && req.post?
      req.ip
    end
  end

  # Limite burst: 20 eventos por 10 segundos
  # Detecta scripts automatizados tentando inflar métricas
  throttle('banner_events/burst', limit: 20, period: 10.seconds) do |req|
    if req.path == '/api/v1/banner_events' && req.post?
      req.ip
    end
  end

  # Anti-fraude: Mesma combinação IP + User-Agent
  # Limite: 30 eventos por minuto para mesma fingerprint
  throttle('banner_events/fingerprint', limit: 30, period: 1.minute) do |req|
    if req.path == '/api/v1/banner_events' && req.post?
      fingerprint = Digest::SHA256.hexdigest("#{req.ip}:#{req.user_agent}")
      fingerprint
    end
  end

  # === Existing Rules ===

  # Intent signal ingest protection
  throttle('intent_signals/ip', limit: 120, period: 1.minute) do |req|
    if req.path == '/api/v1/intent_signals' && req.post?
      req.ip
    end
  end

  # Limitar tentativas de login por IP
  # Protege contra ataques de força bruta
  throttle('logins/ip', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      req.ip
    end
  end

  # Limitar tentativas de login por email
  # Previne ataques direcionados a contas específicas
  throttle('logins/email', limit: 5, period: 20.seconds) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      # Normalizar email (lowercase, sem espaços)
      req.params['email'].to_s.downcase.gsub(/\s+/, "")
    end
  end

  # Limitar requests de recupera??o de senha por IP
  # Evita abuso/spam de e-mail
  throttle('forgot_password/ip', limit: 5, period: 10.minutes) do |req|
    if req.path == '/api/v1/auth/forgot_password' && req.post?
      req.ip
    end
  end

  # Limitar requests de recupera??o de senha por email
  throttle('forgot_password/email', limit: 5, period: 10.minutes) do |req|
    if req.path == '/api/v1/auth/forgot_password' && req.post?
      req.params['email'].to_s.downcase.gsub(/\s+/, '')
    end
  end

  # Limitar requests de reenvio de confirma??o por IP
  # Evita spam de confirma??o e abuso de endpoint
  throttle('resend_confirmation/ip', limit: 5, period: 10.minutes) do |req|
    if req.path == '/api/v1/auth/resend_confirmation' && req.post?
      req.ip
    end
  end

  # Limitar requests de reenvio de confirma??o por email
  throttle('resend_confirmation/email', limit: 5, period: 10.minutes) do |req|
    if req.path == '/api/v1/auth/resend_confirmation' && req.post?
      req.params['email'].to_s.downcase.gsub(/\s+/, '')
    end
  end

  # === Trust API Protection ===
  # Limite: 60 requests por minuto por IP para a Trust API
  throttle('trust_api/ip', limit: 60, period: 1.minute) do |req|
    if req.path.start_with?('/api/v1/trust/')
      req.ip
    end
  end

  # === Stripe SaaS Webhook Protection ===
  # Limite: 60 requests por minuto por IP no webhook de billing
  throttle('billing_webhook/ip', limit: 60, period: 1.minute) do |req|
    if req.path == '/api/v1/billing/webhooks/stripe' && req.post?
      req.ip
    end
  end

  # Limitar requests gerais por IP
  # Protege contra DDoS e scraping agressivo
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    # Não aplicar throttle em assets estáticos
    req.ip unless req.path.start_with?('/assets', '/rails/active_storage')
  end

  # Limitar requests de API por usuário autenticado
  # Rate limit mais alto para usuários autenticados
  throttle('api/user', limit: 1000, period: 1.hour) do |req|
    if req.path.start_with?('/api/v1') && req.env['HTTP_AUTHORIZATION']
      # Extrair user_id do JWT token
      begin
        token = req.env['HTTP_AUTHORIZATION'].split(' ').last
        decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
        decoded[0]['user_id']
      rescue JWT::DecodeError, JWT::ExpiredSignature
        nil
      end
    end
  end

  # === GraphQL Endpoint Protection ===
  # Rate limit para /graphql — previne abuso de queries complexas
  throttle('graphql/ip', limit: 60, period: 1.minute) do |req|
    req.ip if req.path == '/graphql' && req.post?
  end

  # Rate limit específico para mutations críticas do GraphQL (leads e reviews) para evitar spam
  throttle('graphql_mutations/ip', limit: 10, period: 1.minute) do |req|
    if req.path == '/graphql' && req.post?
      begin
        # Ignora se for excessivamente grande para evitar DoS por processamento de body
        if req.content_length.to_i <= 50_000
          body = req.body.read
          req.body.rewind # Crucial retornar o stream do body ao início para o controller do Rails poder ler

          # Verifica se o body contém chamadas de Mutations críticas
          if body.include?('CreateLead') || body.include?('CreateReview') || body.include?('create_lead') || body.include?('create_review')
            req.ip
          end
        end
      rescue => e
        Rails.logger.error("[Rack::Attack] Erro ao analisar request body do GraphQL: #{e.message}")
        nil
      end
    end
  end

  # Rate limit por usuário autenticado no GraphQL
  throttle('graphql/user', limit: 200, period: 1.hour) do |req|
    if req.path == '/graphql' && req.post? && req.env['HTTP_AUTHORIZATION']
      begin
        token = req.env['HTTP_AUTHORIZATION'].split(' ').last
        decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
        "graphql_user_#{decoded[0]['user_id']}"
      rescue JWT::DecodeError, JWT::ExpiredSignature
        nil
      end
    end
  end

  ### Blocklist e Safelist ###

  # Safelist: Sempre permitir localhost (desenvolvimento)
  safelist('allow-localhost') do |req|
    '127.0.0.1' == req.ip || '::1' == req.ip
  end

  # Blocklist: Bloquear IPs conhecidos como maliciosos
  # Carregar de variável de ambiente BLOCKED_IPS (comma-separated)
  blocklist('block-bad-ips') do |req|
    blocked_ips = ENV.fetch('BLOCKED_IPS', '').split(',').map(&:strip)
    blocked_ips.include?(req.ip)
  end

  ### Customizar Response ###
  # Retornar JSON com informação útil ao cliente
  self.throttled_responder = lambda do |env|
    match_data = env['rack.attack.match_data'] || {}
    now = match_data[:epoch_time] || Time.now.to_i

    headers = {
      'Content-Type' => 'application/json',
      'X-RateLimit-Limit' => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset' => (now + (match_data[:period] || 60)).to_s
    }

    # Adicionar Retry-After header
    if match_data[:period]
      headers['Retry-After'] = match_data[:period].to_s
    end

    body = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas solicitações. Por favor, tente novamente mais tarde.',
      details: {
        retry_after_seconds: match_data[:period],
        limit: match_data[:limit],
        period: match_data[:period]
      }
    }

    [429, headers, [body.to_json]]
  end

  ### Track Requests (opcional - útil para métricas) ###
  # Pode ser usado para monitoramento futuro
  track('requests/ip', limit: 1000, period: 1.hour) do |req|
    req.ip unless req.path.start_with?('/assets')
  end
end

### Logging e Notificações ###

# Log quando requests são throttled
ActiveSupport::Notifications.subscribe('throttle.rack_attack') do |name, start, finish, request_id, payload|
  req = payload[:request]
  Rails.logger.warn(
    "[Rack::Attack][Throttled] " \
    "IP: #{req.ip} | " \
    "Path: #{req.path} | " \
    "Matched: #{req.env['rack.attack.matched']} | " \
    "Match Type: #{req.env['rack.attack.match_type']}"
  )
end

# Log quando requests são bloqueados
ActiveSupport::Notifications.subscribe('blocklist.rack_attack') do |name, start, finish, request_id, payload|
  req = payload[:request]
  Rails.logger.error(
    "[Rack::Attack][Blocked] " \
    "IP: #{req.ip} | " \
    "Path: #{req.path} | " \
    "Reason: Blocklisted IP"
  )
end

# Log tracking events (opcional)
ActiveSupport::Notifications.subscribe('track.rack_attack') do |name, start, finish, request_id, payload|
  req = payload[:request]
  Rails.logger.info(
    "[Rack::Attack][Track] " \
    "IP: #{req.ip} | " \
    "Path: #{req.path}"
  )
end

# Log quando safelist é aplicada (debug)
if Rails.env.development?
  ActiveSupport::Notifications.subscribe('safelist.rack_attack') do |name, start, finish, request_id, payload|
    req = payload[:request]
    Rails.logger.debug(
      "[Rack::Attack][Safelist] " \
      "IP: #{req.ip} | " \
      "Path: #{req.path}"
    )
  end
end
