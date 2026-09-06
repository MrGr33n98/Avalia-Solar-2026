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
        to_enqueue = nil

        with_lock do
          case @action
          when 'dispatch', 'start'
            res = dispatch_in_transaction!
            to_enqueue = res.delete(:enqueue_scope)
            res
          when 'pause'
            pause!
          when 'resume'
            res = resume_in_transaction!
            to_enqueue = res.delete(:enqueue_scope)
            res
          when 'cancel'
            cancel!
          when 'retry_failed'
            res = retry_failed_in_transaction!
            to_enqueue = res.delete(:enqueue_scope)
            res
          else
            raise ArgumentError, "Ação desconhecida: #{@action}"
          end
        end.tap do
          if to_enqueue
            enqueue_batches!(scope: to_enqueue)
          end
        end
      end

      private

      def with_lock
        @campaign.with_lock do
          @campaign.reload
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
      end

      def acquire_lock(key, token)
        client = redis_client
        return true unless client

        res = client.set(key, token, nx: true, ex: LOCK_TTL)
        res == true || res == 'OK'
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
        client = redis_client
        return unless client

        client.eval(LUA_RELEASE_SCRIPT, keys: [key], argv: [token])
      rescue StandardError => e
        Rails.logger.warn("[Campaigns::Dispatcher] Erro ao liberar Redis lock: #{e.message}")
      end

      def redis_client
        @redis_client ||= defined?(Redis) ? (Redis.current rescue nil) : nil
      end

      def dispatch_in_transaction!
        if @campaign.dispatching?
          return { status: @campaign.status, already_dispatching: true, message: 'Campanha já está em processamento.' }
        end

        if @campaign.terminal?
          return { status: @campaign.status, error: 'CAMPAIGN_TERMINAL', message: "Campanha em estado final '#{@campaign.status}' não pode ser disparada." }
        end

        if @campaign.paused?
          return { status: @campaign.status, error: 'CAMPAIGN_PAUSED', message: 'Campanha está pausada. Utilize a ação de retomada (resume).' }
        end

        unless @campaign.can_dispatch?
          return { status: @campaign.status, error: 'INVALID_STATUS_TRANSITION', message: "Campanha em estado '#{@campaign.status}' não permite disparo inicial." }
        end

        preflight = Preflight.call(campaign: @campaign)
        unless preflight[:ready]
          return { status: @campaign.status, preflight: preflight, error: 'PREFLIGHT_FAILED', message: 'A campanha não passou no preflight.' }
        end

        if @campaign.recipients.empty?
          SnapshotService.call(campaign: @campaign)
        end

        @campaign.update!(status: 'dispatching', started_at: Time.current)

        { status: @campaign.status, total_recipients: @campaign.total_recipients, preflight: preflight, enqueue_scope: @campaign.recipients.pending }
      end

      def pause!
        return { status: @campaign.status, error: 'INVALID_STATE', message: 'Apenas campanhas em envio podem ser pausadas' } unless @campaign.can_pause?

        @campaign.update!(status: 'paused')
        { status: @campaign.status, message: 'Envio de campanha pausado com sucesso' }
      end

      def resume_in_transaction!
        return { status: @campaign.status, error: 'INVALID_STATE', message: 'Apenas campanhas pausadas podem ser retomadas' } unless @campaign.can_resume?

        preflight = Preflight.call(campaign: @campaign)
        unless preflight[:ready]
          return { status: @campaign.status, preflight: preflight, error: 'PREFLIGHT_FAILED', message: 'Preflight falhou ao retomar campanha.' }
        end

        @campaign.update!(status: 'dispatching')
        { status: @campaign.status, message: 'Envio de campanha retomado com sucesso', enqueue_scope: @campaign.recipients.pending }
      end

      def cancel!
        return { status: @campaign.status, error: 'INVALID_STATE', message: 'Campanha já está em estado final' } if @campaign.terminal?

        @campaign.update!(status: 'cancelled')
        { status: @campaign.status, message: 'Campanha cancelada com sucesso' }
      end

      def retry_failed_in_transaction!
        return { status: @campaign.status, error: 'INVALID_STATE', message: 'Apenas campanhas ativas/falhas aceitam retry' } if @campaign.terminal?

        failed_recipients = @campaign.recipients.where(status: 'failed')
        return { status: @campaign.status, retried_count: 0 } if failed_recipients.empty?

        recipients_to_retry = []
        suppressed_ids = []

        failed_recipients.find_each do |r|
          if ::Sales::Messaging::SuppressionChecker.blocked?(company_id: @campaign.company_id, email: r.email)
            suppressed_ids << r.id
          else
            recipients_to_retry << r.id
          end
        end

        if suppressed_ids.any?
          @campaign.recipients.where(id: suppressed_ids).update_all(status: 'unsubscribed', error_message: 'SUPPRESSED_AT_RETRY_TIME')
        end

        retried_count = recipients_to_retry.size
        return { status: @campaign.status, retried_count: 0 } if retried_count.zero?

        retry_scope = @campaign.recipients.where(id: recipients_to_retry)
        retry_scope.update_all(status: 'pending', error_message: nil)

        # Transition associated failed EmailMessages to queued (canonical retry boundary)
        failed_messages = ::Sales::EmailMessage.where(
          company_id: @campaign.company_id,
          sales_campaign_id: @campaign.id,
          sales_campaign_recipient_id: recipients_to_retry,
          status: 'failed'
        )

        failed_messages.find_each do |email_msg|
          cleaned_meta = (email_msg.metadata || {}).except('error', :error)
          email_msg.update!(status: 'queued', metadata: cleaned_meta)
        end

        @campaign.update!(status: 'dispatching')

        { status: @campaign.status, retried_count: retried_count, enqueue_scope: retry_scope }
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
