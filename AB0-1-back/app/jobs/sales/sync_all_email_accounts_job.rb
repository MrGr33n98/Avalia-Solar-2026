# frozen_string_literal: true

module Sales
  class SyncAllEmailAccountsJob < ApplicationJob
    queue_as :sales_email_sync

    def perform
      Sales::EmailAccount.where(provider: 'zoho')
                         .where.not(connection_status: 'disconnected')
                         .find_each do |account|
        Sales::SyncEmailAccountJob.perform_later(account.id, mode: 'incremental')
      rescue StandardError => e
        Rails.logger.warn("[SyncAllEmailAccountsJob] Falha ao enfileirar conta #{account.id}: #{e.message}")
      end
    end
  end
end

