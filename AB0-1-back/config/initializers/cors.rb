# frozen_string_literal: true

# CORS Configuration - TASK-003
# Configuração segura de CORS por ambiente

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Origins permitidas por ambiente
    origins_list = case Rails.env
    when 'production'
      production_origins = [
        'https://www.avaliasolar.com.br',
        'https://avaliasolar.com.br',
        'http://www.avaliasolar.com.br',
        'http://avaliasolar.com.br',
        'https://ab0-1.com',
        'https://www.ab0-1.com',
        'http://ab0-1.com',
        'http://www.ab0-1.com',
        ENV.fetch("FRONTEND_ORIGIN", "https://www.avaliasolar.com.br")
      ]
      # Permitir origins adicionais via ENV (comma-separated)
      additional_origins = ENV['ADDITIONAL_ALLOWED_ORIGINS']&.split(',')&.map(&:strip) || []
      (production_origins + additional_origins).flatten.compact
    when 'staging'
      [
        'https://staging.avaliasolar.com.br',
        'https://staging-api.avaliasolar.com.br',
        ENV.fetch("FRONTEND_ORIGIN", "https://staging.avaliasolar.com.br"),
        ENV['ADDITIONAL_ALLOWED_ORIGINS']&.split(',')&.map(&:strip) || []
      ].flatten.compact
    when 'development', 'test'
      [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        # Permitir qualquer localhost na porta 3000-3010
        /http:\/\/localhost:\d{4}/,
        /http:\/\/127\.0\.0\.1:\d{4}/,
        ENV.fetch("FRONTEND_ORIGIN", "http://localhost:3000")
      ]
    else
      # Por padrão, não permite nenhum origin (segurança)
      [ENV.fetch("FRONTEND_ORIGIN", "")]
    end

    origins origins_list

    # API resources
    resource '/api/v1/*',
      headers: :any,
      expose: [
        # Headers de autenticação
        'access-token',
        'expiry',
        'token-type',
        'uid',
        'client',
        'Authorization',
        # Headers de rate limiting (TASK-001)
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After'
      ],
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      max_age: 3600 # Cache preflight por 1 hora

    # Active Storage resources
    resource '/rails/active_storage/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true

    # Health check endpoint (não precisa credentials)
    resource '/health',
      headers: :any,
      methods: [:get, :options, :head],
      credentials: false
  end
end

# Log configuração em desenvolvimento
if Rails.env.development?
  Rails.logger.info "[CORS] Allowed origins configurados para desenvolvimento"
end
