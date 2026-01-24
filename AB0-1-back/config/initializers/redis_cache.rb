# frozen_string_literal: true

# Configuração de Cache Redis - Fase 1
#
# Implementa cache hierárquico com namespace para facilitar invalidação
# TTL padrão de 5 minutos, otimizado para banners
#
# Variáveis de ambiente necessárias:
# - REDIS_URL: URL completa do Redis (ex: redis://localhost:6379/0)

require 'active_support/core_ext/numeric/bytes'

if Rails.env.production? || Rails.env.staging?
  Rails.application.config.cache_store = :redis_cache_store, {
    url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1'),
    namespace: 'avaliasolar:cache',
    expires_in: 5.minutes,
    
    # Connection pool para alta concorrência
    pool_size: ENV.fetch('RAILS_MAX_THREADS', 5).to_i,
    pool_timeout: 5,
    
    # Reconnect automaticamente se conexão cair
    reconnect_attempts: 3,
    
    # Configurações de performance
    connect_timeout: 1,
    read_timeout: 1,
    write_timeout: 1,
    
    # Compressão para payloads > 1KB
    compress: true,
    compress_threshold: 1.kilobyte,
    
    # Error handler: não quebra app se Redis falhar
    error_handler: ->(method:, returning:, exception:) {
      Rails.logger.error("[Redis Cache] Error on #{method}: #{exception.message}")
      Sentry.capture_exception(exception) if defined?(Sentry)
    }
  }

  Rails.logger.info('[Cache] Redis cache store configurado com sucesso')
end
