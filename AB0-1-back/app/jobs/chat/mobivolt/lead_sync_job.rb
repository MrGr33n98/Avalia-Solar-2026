# frozen_string_literal: true

module Chat
  module Mobivolt
    class LeadSyncJob < ApplicationJob
      queue_as :default

      # Configura retries automáticos com exponential backoff para falhas de infraestrutura temporárias
      retry_on StandardError, wait: :exponentially_longer, attempts: 5 do |job, error|
        chat_lead_id = job.arguments.first
        Rails.logger.error("[Chat::Mobivolt::LeadSyncJob] Permanent failure syncing ChatLead ##{chat_lead_id}: #{error.message}")

        # Disparar telemetria definitiva de falha
        Chat::PosthogTrackingService.track(
          event: 'mobivolt_lead_sync_failed_permanently',
          distinct_id: 'system_job',
          properties: {
            chat_lead_id: chat_lead_id,
            error: error.message
          }
        )
      end

      def perform(chat_lead_id)
        chat_lead = ChatLead.find_by(id: chat_lead_id)
        if chat_lead.nil?
          Rails.logger.warn("[Chat::Mobivolt::LeadSyncJob] Skipping sync: ChatLead ##{chat_lead_id} not found.")
          return
        end

        # Executa a sincronização segura e idempotente
        Chat::Mobivolt::LeadSyncService.sync!(chat_lead)
      end
    end
  end
end
