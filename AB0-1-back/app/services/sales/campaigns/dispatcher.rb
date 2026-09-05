# frozen_string_literal: true

module Sales
  module Campaigns
    class Dispatcher
      BATCH_SIZE = 50

      def self.call(campaign:, action: 'dispatch')
        new(campaign: campaign, action: action).call
      end

      def initialize(campaign:, action: 'dispatch')
        @campaign = campaign
        @action = action.to_s
      end

      def call
        case @action
        when 'dispatch', 'start'
          dispatch!
        when 'pause'
          pause!
        when 'resume'
          resume!
        when 'retry_failed'
          retry_failed!
        else
          raise ArgumentError, "Ação desconhecida: #{@action}"
        end
      end

      private

      def dispatch!
        return { status: @campaign.status, message: 'Campanha já finalizada' } if @campaign.status == 'completed'

        if @campaign.recipients.empty?
          SnapshotService.call(campaign: @campaign)
        end

        @campaign.update!(status: 'dispatching', started_at: Time.current)
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, total_recipients: @campaign.total_recipients }
      end

      def pause!
        return { status: @campaign.status, message: 'Apenas campanhas em envio podem ser pausadas' } unless @campaign.can_pause?

        @campaign.update!(status: 'paused')
        { status: @campaign.status, message: 'Envio de campanha pausado' }
      end

      def resume!
        return { status: @campaign.status, message: 'Apenas campanhas pausadas podem ser retomadas' } unless @campaign.can_resume?

        @campaign.update!(status: 'dispatching')
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, message: 'Envio de campanha retomado' }
      end

      def retry_failed!
        failed_recipients = @campaign.recipients.where(status: 'failed')
        return { status: @campaign.status, count: 0 } if failed_recipients.empty?

        failed_recipients.update_all(status: 'pending', error_message: nil)
        @campaign.update!(status: 'dispatching')
        enqueue_batches!(scope: @campaign.recipients.pending)

        { status: @campaign.status, retried_count: failed_recipients.count }
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
