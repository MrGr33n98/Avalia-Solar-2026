# frozen_string_literal: true

# Configuração do Rack::Attack para rate limiting
# Implementado em: TASK-001
# Documentação: https://github.com/rack/rack-attack

class Rack::Attack
  ### Configuração de Cache ###
  # Usar MemoryStore para início, migrar para Redis depois (TASK-014)
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Throttle Configurations ###

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
        decoded = JWT.decode(token, ENV['JWT_SECRET'], true, algorithm: 'HS256')
        decoded[0]['user_id']
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
    match_data = env['rack.attack.match_data']
    now = match_data[:epoch_time]

    headers = {
      'Content-Type' => 'application/json',
      'X-RateLimit-Limit' => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset' => (now + match_data[:period]).to_s
    }

    # Adicionar Retry-After header
    if match_data[:period]
      headers['Retry-After'] = match_data[:period].to_s
    end

    body = {
      error: 'Rate limit exceeded. Please try again later.',
      message: 'Too many requests',
      retry_after_seconds: match_data[:period],
      limit: match_data[:limit],
      period: match_data[:period]
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
