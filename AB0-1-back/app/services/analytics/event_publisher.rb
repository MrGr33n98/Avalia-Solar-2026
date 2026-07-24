module Analytics
  class EventPublisher
    # Redis key para a stream de eventos analíticos
    STREAM_KEY = 'analytics:events:raw'.freeze

    def self.publish(event_type, payload, user_id: nil)
      # Falha-segura: se der erro, captura e engole para não quebrar a transação web principal

      anonymized_payload = Analytics::LgpdAnonymizer.new(payload.merge(user_id: user_id)).anonymize

      event_data = {
        event_type: event_type,
        timestamp: Time.current.iso8601,
        payload: anonymized_payload.to_json
      }

      # XADD - Adiciona evento na Stream do Redis. O ID '*' gera um auto-id baseado em timestamp
      REDIS.xadd(STREAM_KEY, event_data)

      # Agenda o worker para consumo em lote (ex: a cada N minutos/horas ou volume)
      # Em um cenário real de alta escala isso seria agendado via cron/cron-job,
      # mas para MVP ativamos debounce ou simplesmente logamos a intenção.
      Analytics::BigQueryBatchFlushJob.perform_later unless flush_already_scheduled?
    rescue StandardError => e
      Rails.logger.error("[Analytics::EventPublisher] Falha ao publicar evento #{event_type}: #{e.message}")
      # A regra de ouro é nunca levantar exceção que quebre o fluxo HTTP do cliente
    end

    def self.flush_already_scheduled?
      # Lógica simplificada de debounce/lock para evitar enfileirar múltiplos jobs de flush
      # Usando uma chave com TTL no redis de 5 minutos
      return true unless REDIS.set('analytics:flush_lock', '1', nx: true, ex: 5.minutes.to_i)

      false
    end
  end
end
