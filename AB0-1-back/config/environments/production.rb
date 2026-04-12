require "active_support/core_ext/integer/time"
require "ipaddr"
require "uri"

Rails.application.configure do
  # Configurações básicas de performance
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  # --- CORREÇÃO DE ASSETS (CSS/JS) ---
  # Garante que o Rails sirva arquivos da pasta public/assets
  config.public_file_server.enabled = true
  # Habilita compilação dinâmica caso a pré-compilação do Docker falhe
  config.assets.compile = true 
  config.assets.digest = true

  # Armazenamento e Host de API
  # IMPORTANTE: Usar Spaces em produção para persistir imagens entre deploys.
  # Fallback para local caso credenciais estejam ausentes, evitando erro 500 no admin.
  active_storage_service = ENV.fetch('ACTIVE_STORAGE_SERVICE', 'spaces')
  if active_storage_service == 'spaces' && (ENV['SPACES_ACCESS_KEY_ID'].blank? || ENV['SPACES_SECRET_ACCESS_KEY'].blank?)
    msg = '[ActiveStorage] Credenciais do Spaces ausentes. Aplicando fallback para storage local.'
    Rails.logger&.error(msg) || warn(msg)
    active_storage_service = 'local'
  end
  config.active_storage.service = active_storage_service.to_sym
  # Evita 404 por URL expirada do DiskService em páginas cacheadas
  config.active_storage.service_urls_expire_in = 7.days
  
  # Força o uso de proxy para servir imagens via API em vez de redirecionar para o S3.
  # `:proxy` chama `proxy_url` e quebra no `url_for`; o valor correto é `:rails_storage_proxy`.
  config.active_storage.resolve_model_to_route = :rails_storage_proxy
  
  # --- CONFIGURAÇÃO UNIFICADA DE URL ---
  # Usa APP_HOST com esquema; extrai host e protocolo corretamente
  app_host = ENV.fetch('APP_HOST', 'https://api.avaliasolar.com.br')
  uri = URI(app_host)
  host = uri.host || app_host
  protocol = uri.scheme || 'https'

  # Usar o host vindo do APP_HOST, mas permitir que o Rails use o host atual da requisição se disponível
  Rails.application.routes.default_url_options = { host: host, protocol: protocol }
  config.action_controller.default_url_options = { host: host, protocol: protocol }
  config.active_storage.default_url_options = { host: host, protocol: protocol }
  config.action_mailer.default_url_options = { host: host, protocol: protocol }

  config.assume_ssl = true
  # Disable force_ssl to prevent redirect loops in Docker/Proxy environments
  config.force_ssl = false

  # Garante que o Rails identifique o protocolo HTTPS vindo do Proxy/Cloudflare
  config.action_dispatch.default_headers = {
    'X-Frame-Options' => 'SAMEORIGIN',
    'X-Content-Type-Options' => 'nosniff',
    'X-XSS-Protection' => '1; mode=block'
  }

  # Logs e Monitoramento
  config.log_level = :info
  config.log_tags = [ :request_id ]

  # Permite que o Nginx repasse o tráfego para o Docker com segurança
  config.action_dispatch.trusted_proxies = [
    IPAddr.new("127.0.0.1"),
    IPAddr.new("10.0.0.0/8"),
    IPAddr.new("172.16.0.0/12"),
    IPAddr.new("192.168.0.0/16")
  ]
  config.action_dispatch.ip_spoofing_check = false
  # Suporte a domínios .com.br (2 partes de TLD)
  config.action_dispatch.tld_length = 2

  # --- CONFIGURAÇÃO DE CACHE (REDIS) ---
  if ENV.fetch('REDIS_ENABLED', 'true') == 'true'
    config.cache_store = :redis_cache_store, {
      url: ENV.fetch('REDIS_URL', 'redis://avalia_redis_prod:6379/0'),
      expires_in: 1.hour,
      reconnect_attempts: 5
    }
  else
    config.cache_store = :memory_store
  end

  # Fila de processamento (Usando :sidekiq para processamento em background)
  config.active_job.queue_adapter = :sidekiq

  # Action Cable (WebSocket) - habilita conexões do domínio público
  config.action_cable.url = ENV.fetch('ACTION_CABLE_URL', 'wss://api.avaliasolar.com.br/cable')
  config.action_cable.allowed_request_origins = [
    'https://avaliasolar.com.br',
    'https://www.avaliasolar.com.br',
    'http://avaliasolar.com.br',
    'http://www.avaliasolar.com.br'
  ]

  # Localização e Fallbacks
  config.i18n.fallbacks = true
  config.active_support.report_deprecations = false

  # Log para STDOUT para o Docker capturar corretamente
  if ENV["RAILS_LOG_TO_STDOUT"].present?
    logger           = ActiveSupport::Logger.new(STDOUT)
    logger.formatter = ::Logger::Formatter.new
    config.logger    = ActiveSupport::TaggedLogging.new(logger)
  end

  # Não faz dump do schema após migrations em produção
  config.active_record.dump_schema_after_migration = false

  # --- CONFIGURAÇÃO DE E-MAIL (ACTION MAILER) ---
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :smtp

  # --- LIBERAÇÃO DE HOSTS ---
  # Whitelist mínima de hosts (evitar liberar todos com config.hosts.clear)
  # Inclui localhost para healthchecks internos
  normalize_host = lambda do |raw_value|
    raw = raw_value.to_s.strip
    next nil if raw.empty?

    candidate = raw.match?(%r{\Ahttps?://}i) ? raw : "https://#{raw}"
    parsed = URI.parse(candidate)
    parsed.host || raw.split('/').first
  rescue URI::InvalidURIError
    raw.split('/').first
  end

  # Sempre permitir hosts internos de rede para proxy entre serviços.
  allowed_hosts = %w[
    localhost
    127.0.0.1
    backend
    ab0-backend
    avaliasolar.com.br
    www.avaliasolar.com.br
    api.avaliasolar.com.br
    app.avaliasolar.com.br
    ab0-1.com
    www.ab0-1.com
  ]
  allowed_hosts << host if host.present?

  %w[APP_HOST FRONTEND_ORIGIN NEXT_PUBLIC_SITE_URL API_URL_INTERNAL API_PROXY_TARGET].each do |env_key|
    parsed_host = normalize_host.call(ENV[env_key])
    allowed_hosts << parsed_host if parsed_host.present?
  end

  extra_hosts = ENV.fetch('ALLOWED_HOSTS', '')
                   .split(',')
                   .map { |value| normalize_host.call(value) }
                   .compact
  allowed_hosts.concat(extra_hosts)

  config.hosts.concat(allowed_hosts.map(&:downcase).uniq) if allowed_hosts.any?
end
