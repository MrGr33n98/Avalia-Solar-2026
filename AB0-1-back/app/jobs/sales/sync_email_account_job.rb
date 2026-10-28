# frozen_string_literal: true

module Sales
  class SyncEmailAccountJob < ApplicationJob
    queue_as :sales_email_sync

    def perform(sales_email_account_id, mode: 'incremental')
      account = Sales::EmailAccount.find_by(id: sales_email_account_id)
      return unless account&.zoho? && account.connection_status != 'disconnected'

      token = EmailSync::TokenRefresher.refresh_if_needed!(account)
      unless token
        account.update!(sync_status: 'error', sync_error: 'Token inválido ou expirado. Reconecte a conta.')
        return
      end

      account.update!(sync_status: 'syncing', sync_error: nil)
      client = EmailSync::ZohoApiClient.new(account.provider_region || 'us')

      # Ensure provider_account_id
      account_id = account.provider_account_id
      if account_id.blank?
        accounts = client.list_accounts(access_token: token)
        matched = accounts.find { |a| a[:email] == account.email.downcase } || accounts.first
        if matched
          account.update!(provider_account_id: matched[:account_id])
          account_id = matched[:account_id]
        end
      end

      return unless account_id.present?

      # Folders to sync: Inbox and Sent
      folders = client.list_folders(access_token: token, account_id: account_id)
      inbox_folder = folders.find { |f| f[:type].to_s.casecmp('inbox').zero? || f[:name].to_s.casecmp('inbox').zero? }
      sent_folder = folders.find { |f| f[:type].to_s.casecmp('sent').zero? || f[:name].to_s.casecmp('sent').zero? }

      imported_count = 0

      # Sync Inbox
      if inbox_folder
        imported_count += sync_folder(client, token, account, account_id, inbox_folder[:folder_id], 'inbound')
      end

      # Sync Sent
      if sent_folder
        imported_count += sync_folder(client, token, account, account_id, sent_folder[:folder_id], 'outbound')
      end

      account.update!(
        sync_status: 'healthy',
        last_synced_at: Time.current,
        messages_imported: account.messages_imported + imported_count,
        sync_error: nil
      )
    rescue EmailSync::ZohoApiClient::RateLimitError => e
      account.update!(sync_status: 'degraded', sync_error: 'Limite de requisições Zoho atingido. Aguardando intervalo.')
      Rails.logger.warn("[SyncEmailAccountJob] Rate limit for account #{sales_email_account_id}: #{e.message}")
    rescue StandardError => e
      account.update!(sync_status: 'error', sync_error: e.message)
      Rails.logger.error("[SyncEmailAccountJob] Failed for account #{sales_email_account_id}: #{e.class} - #{e.message}")
    end

    private

    def sync_folder(client, token, account, account_id, folder_id, direction)
      # Checkpoint state
      sync_state = Sales::EmailSyncState.find_or_create_by!(
        company_id: account.company_id,
        sales_email_account_id: account.id,
        provider_folder_id: folder_id
      )

      sync_state.update!(last_started_at: Time.current)
      messages = client.list_messages(
        access_token: token,
        account_id: account_id,
        folder_id: folder_id,
        limit: 30,
        start: 1
      )

      imported = 0
      messages.each do |msg|
        next if msg[:message_id].blank?

        # Check existing message
        existing = Sales::EmailMessage.find_by(
          sales_email_account_id: account.id,
          provider_message_id: msg[:message_id]
        )
        next if existing

        # Occurred at
        occurred_at = if msg[:received_time].present?
                        Time.at(msg[:received_time].to_i / 1000.0) rescue Time.current
                      else
                        Time.current
                      end

        # Resolve or create thread
        thread = EmailSync::ThreadMatcher.resolve_or_create_thread(
          email_account: account,
          provider_thread_id: msg[:thread_id],
          subject: msg[:subject],
          occurred_at: occurred_at
        )

        from_email = (msg[:from] || '').downcase.strip
        to_email = (msg[:to] || '').downcase.strip

        # Match with CRM entities
        target_email = direction == 'inbound' ? from_email : to_email
        crm_match = EmailSync::CrmMessageMatcher.match(company_id: account.company_id, email_address: target_email)

        # Update thread links if not set
        if thread.sales_contact_id.nil? && crm_match[:contact_id]
          thread.update!(
            sales_contact_id: crm_match[:contact_id],
            sales_account_id: crm_match[:account_id],
            sales_opportunity_id: crm_match[:opportunity_id]
          )
        end

        # Ingest message
        created_msg = Sales::EmailMessage.create!(
          company_id: account.company_id,
          sales_email_account_id: account.id,
          sales_email_thread_id: thread.id,
          sales_account_id: thread.sales_account_id || crm_match[:account_id],
          sales_contact_id: thread.sales_contact_id || crm_match[:contact_id],
          sales_opportunity_id: thread.sales_opportunity_id || crm_match[:opportunity_id],
          sender_user_id: direction == 'outbound' ? account.user_id : nil,
          from_email: from_email.presence || account.email,
          to_email: to_email.presence || 'contato@cliente.com',
          subject: msg[:subject] || '(Sem assunto)',
          body_text: msg[:summary] || '',
          status: direction == 'inbound' ? 'received' : 'sent',
          direction: direction,
          delivery_status: 'delivered',
          provider_message_id: msg[:message_id],
          provider_folder_id: folder_id,
          provider_received_at: occurred_at,
          created_at: occurred_at
        )

        thread.update!(message_count: thread.messages.count)
        imported += 1
      end

      sync_state.update!(
        last_succeeded_at: Time.current,
        high_watermark_at: Time.current,
        last_error_code: nil
      )

      imported
    end
  end
end
