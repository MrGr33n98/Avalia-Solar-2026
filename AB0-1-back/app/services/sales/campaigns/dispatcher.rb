# frozen_string_literal: true

module Sales
  module Campaigns
    class Dispatcher
      BATCH_SIZE = 100
      LOCK_TTL = 60 # segundos

      def self.call(campaign:, action: 'dispatch')
        new(campaign: campaign, action: action).call
      end

      def initialize(campaign:, action: 'dispatch')
        @campaign = campaign
        @action = action.to_s
      end

      def call
        with_lock do
          case @action
          when 'dispatch', 'start'
            dispatch!
          when 'pause'
            pause!
          when 'resume'
            resume!
          when 'cancel'
            cancel!
          when 'retry_failed'
            retry_failed!
          else
            raise ArgumentError, "Ação desconhecida: #{@action}"
          end
        end
      end

      private

      def with_lock
        lock_key = "campaign:dispatch_lock:#{@campaign.id}"
        token = SecureRandom.uuid
        locked = acquire_lock(lock_key, token)

        unless locked
          return { status: @campaign.status, error: 'DISPATCH_IN_PROGRESS', message: 'Já existe um disparo ou operação em andamento para esta campanha.' }
        end

        begin
          yield
        ensure
          release_lock(lock_key, token)
        end
      end

      def acquire_lock(key, token)
        if redis_client
          redis_client.set(key, token, nx: true, ex: LOCK_TTL)
        else
          true
        end
      rescue StandardError => e
        Rails.logger.warn("[Campaigns::Dispatcher] Redis lock indisponível: #{e.message}")
        true
      end

      LUA_RELEASE_SCRIPT = <<~LUA
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      LUA

      def release_lock(key, token)
        if redis_client
          redis_client.eval(LUA_RELEASE_SCRIPT, keys: [key], argv: [token])
        end
      rescue StandardError => e
        Rails.logger.warn("[Campaigns::Dispatcher] Erro ao liberar Redis lock: #{e.message}")
      end

      def redis_client
        @redis_client ||= defined?(Redis) ? (Redis.current rescue nil) : nil
      end

      def dispatch!
        return { status: @campaign.status, message: 'Campanha já finalizada' } if @campaign.status == 'completed'

        preflight = Preflight.call(campaign: @campaign)
        unless preflight[:ready]
          return { status: @campaign.status, preflight: preflight, error: 'PREFLIGHT_FAILED', message: 'A campanha não passou no preflight.' }
        end

        if @campaign.recipients.empty?
          SnapshotService.call(campaign: @campaign)
        end

        @campaign.update!(status: 'dispatching', started_at: Time.current)
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, total_recipients: @campaign.total_recipients, preflight: preflight }
      end

      def pause!
        return { status: @campaign.status, message: 'Apenas campanhas em envio podem ser pausadas' } unless @campaign.can_pause?

        @campaign.update!(status: 'paused')
        { status: @campaign.status, message: 'Envio de campanha pausado com sucesso' }
      end

      def resume!
        return { status: @campaign.status, message: 'Apenas campanhas pausadas podem ser retomadas' } unless @campaign.can_resume?

        preflight = Preflight.call(campaign: @campaign)
        unless preflight[:ready]
          return { status: @campaign.status, preflight: preflight, error: 'PREFLIGHT_FAILED', message: 'Preflight falhou ao retomar campanha.' }
        end

        @campaign.update!(status: 'dispatching')
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, message: 'Envio de campanha retomado com sucesso' }
      end

      def cancel!
        @campaign.update!(status: 'cancelled')
        { status: @campaign.status, message: 'Campanha cancelada com sucesso' }
      end

      def retry_failed!
        failed_recipients = @campaign.recipients.where(status: 'failed')
        retried_count = failed_recipients.count
        return { status: @campaign.status, retried_count: 0 } if retried_count.zero?

        failed_recipients.update_all(status: 'pending', error_message: nil)
        @campaign.update!(status: 'dispatching')
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, retried_count: retried_count }
      end

      def enqueue_batches!(scope:)
        scope.find_in_batches(batch_size: BATCH_SIZE) do |batch|
          recipient_ids = batch.map(&:id)
          ::Sales::CampaignBatchProcessorJob.perform_later(@campaign.id, recipient_ids)
        end
      end
    end
  end
end
