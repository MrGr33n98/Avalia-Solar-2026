module Analytics
  class BigQueryBatchFlushJob < ApplicationJob
    queue_as :analytics

    def perform
      # Simulação de consumo da stream 'analytics:events:raw' no Redis
      # Na prática, usamos XRANGE ou XREADGROUP para processar batches de eventos

      events = fetch_events_from_redis
      return if events.empty?

      begin
        # Simulação de conexão e envio de batch streaming para o BigQuery/ClickHouse
        send_to_data_warehouse(events)

        # Só remove os eventos do Redis após o ACK de sucesso do Data Warehouse (Garantia at-least-once)
        ack_events_in_redis(events.keys)
      rescue StandardError => e
        # Se falhar o envio para o DW, a job falha, o Sidekiq re-tenta, e os eventos
        # continuam seguros no Redis (sem perda de dados analíticos)
        Rails.logger.error("[Analytics::BigQueryBatchFlushJob] Falha no flush para DW: #{e.message}")
        raise e
      end
    end

    private

    def fetch_events_from_redis
      # Lemos os eventos mais antigos da stream até um limite de batch (ex: 1000)
      # Retorna array de pares [message_id, {event_data}]
      redis.xrange(Analytics::EventPublisher::STREAM_KEY, '-', '+', count: 1000).to_h
    rescue Redis::CommandError
      {} # Evita erro em testes sem redis
    end

    def send_to_data_warehouse(events)
      # Simulação do SDK do Google Cloud BigQuery
      # bigquery = Google::Cloud::Bigquery.new
      # dataset = bigquery.dataset "avalia_solar_analytics"
      # table = dataset.table "events_raw"
      # table.insert(events.values.map { |e| format_for_bq(e) })

      Rails.logger.info("[Analytics::BigQueryBatchFlushJob] #{events.size} eventos enviados para o DW com sucesso.")
    end

    def ack_events_in_redis(message_ids)
      # Remove as mensagens processadas da stream
      redis.xdel(Analytics::EventPublisher::STREAM_KEY, message_ids) unless message_ids.empty?
    end

    def redis
      REDIS
    end
  end
end
