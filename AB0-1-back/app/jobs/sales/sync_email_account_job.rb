# frozen_string_literal: true

module Sales
  class SyncEmailAccountJob < ApplicationJob
    queue_as :sales_email_sync

    INBOX_FOLDER_NAMES = %w[inbox caixa\ de\ entrada entrada].freeze
    SENT_FOLDER_NAMES = %w[sent enviados sent\ messages itens\ enviados].freeze

    def perform(sales_email_account_id, mode: 'incremental')
      account = Sales::EmailAccount.find_by(id: sales_email_account_id)
      return unless account&.zoho? && account.connection_status != 'disconnected'

      token = EmailSync::TokenRefresher.refresh_if_needed!(account)
      unless token
        account.update!(
          connection_status: 'needs_reconnect',
          sync_status: 'error',
          sync_error: 'Token inválido ou expirado. Reconecte a conta.'
        )
        return
      end

      account.update!(sync_status: 'syncing', sync_error: nil)
      client = EmailSync::ZohoApiClient.new(account.provider_region || 'us')

      # Ensure provider_account_id
      account_id = account.provider_account_id
      if account_id.blank?
        accounts = client.list_accounts(access_token: token)
        matched = accounts.find { |a| a[:email].to_s.casecmp(account.email.to_s).zero? } || accounts.first
        if matched && matched[:account_id].present?
          account.update!(provider_account_id: matched[:account_id])
          account_id = matched[:account_id]
        end
      end

      unless account_id.present?
        account.update!(sync_status: 'error', sync_error: 'ID da caixa Zoho não encontrado para esta conta.')
        return
      end

      # Folders to sync: Inbox and Sent (supports EN and PT-BR folder names/types)
      folders = client.list_folders(access_token: token, account_id: account_id)
      inbox_folder = folders.find do |f|
        INBOX_FOLDER_NAMES.include?(f[:type].to_s.strip.downcase) ||
          INBOX_FOLDER_NAMES.include?(f[:name].to_s.strip.downcase)
      end || folders.first

      sent_folder = folders.find do |f|
        SENT_FOLDER_NAMES.include?(f[:type].to_s.strip.downcase) ||
          SENT_FOLDER_NAMES.include?(f[:name].to_s.strip.downcase)
      end

      imported_count = 0
      needs_backfill_continuation = false

      if inbox_folder && inbox_folder[:folder_id].present?
        res = sync_folder(client, token, account, account_id, inbox_folder[:folder_id], 'inbound', mode: mode)
        imported_count += res[:imported]
        needs_backfill_continuation ||= res[:has_more]
      end

      if sent_folder && sent_folder[:folder_id].present? && sent_folder[:folder_id] != inbox_folder&.dig(:folder_id)
        res = sync_folder(client, token, account, account_id, sent_folder[:folder_id], 'outbound', mode: mode)
        imported_count += res[:imported]
        needs_backfill_continuation ||= res[:has_more]
      end

      reconcile_account_threads_and_counters!(account, imported_count, status: 'healthy', error: nil)

      if needs_backfill_continuation && %w[full backfill].include?(mode.to_s)
        Sales::SyncEmailAccountJob.perform_later(account.id, mode: 'backfill')
      end
    rescue EmailSync::ZohoApiClient::AuthError => e
      reconcile_account_threads_and_counters!(
        account,
        0,
        connection_status: 'needs_reconnect',
        status: 'error',
        error: 'Sessão Zoho expirada ou revogada. Reconecte a conta.'
      )
      Rails.logger.warn("[SyncEmailAccountJob] Auth error for account #{sales_email_account_id}: #{e.message}")
    rescue EmailSync::ZohoApiClient::RateLimitError => e
      reconcile_account_threads_and_counters!(
        account,
        0,
        status: 'degraded',
        error: 'Limite de requisições Zoho atingido. Aguardando intervalo.'
      )
      Rails.logger.warn("[SyncEmailAccountJob] Rate limit for account #{sales_email_account_id}: #{e.message}")
    rescue StandardError => e
      reconcile_account_threads_and_counters!(account, 0, status: 'error', error: e.message)
      Rails.logger.error("[SyncEmailAccountJob] Failed for account #{sales_email_account_id}: #{e.class} - #{e.message}")
    end

    private

    def sync_folder(client, token, account, account_id, folder_id, direction, mode: 'incremental')
      sync_state = Sales::EmailSyncState.find_or_create_by!(
        company_id: account.company_id,
        sales_email_account_id: account.id,
        provider_folder_id: folder_id.to_s
      )

      sync_state.update!(last_started_at: Time.current, last_error_code: nil)

      start_page = resolve_start_page(sync_state.cursor, mode)
      max_pages_this_run = case mode.to_s
                           when 'backfill' then 15
                           when 'full' then 8
                           else 2
                           end
      batch_limit = %w[full backfill].include?(mode.to_s) ? 50 : 30

      imported = 0
      page = start_page
      pages_processed = 0
      has_more = true

      while has_more && pages_processed < max_pages_this_run
        start_offset = ((page - 1) * batch_limit) + 1
        messages = client.list_messages(
          access_token: token,
          account_id: account_id,
          folder_id: folder_id,
          limit: batch_limit,
          start: start_offset
        )

        if messages.blank?
          has_more = false
          break
        end

        messages.each do |msg|
          imported += 1 if ingest_single_message(client, token, account, folder_id, direction, msg)
        end

        pages_processed += 1
        has_more = messages.size >= batch_limit
        page += 1

        # Persiste checkpoint a cada página concluída com apenas colunas válidas de Sales::EmailSyncState
        sync_state.update!(
          cursor: has_more ? "next_page:#{page}" : "completed_page:#{page - 1}",
          last_succeeded_at: Time.current,
          high_watermark_at: Time.current,
          last_error_code: nil,
          retry_count: 0
        )
      end

      if pages_processed.zero?
        sync_state.update!(
          cursor: 'completed_page:1',
          last_succeeded_at: Time.current,
          high_watermark_at: Time.current,
          last_error_code: nil,
          retry_count: 0
        )
      end

      { imported: imported, has_more: has_more }
    rescue StandardError => e
      sync_state&.update(
        last_error_code: e.class.name.demodulize,
        retry_count: sync_state.retry_count.to_i + 1
      )
      raise e
    end

    def resolve_start_page(cursor, mode)
      return 1 unless mode.to_s == 'backfill'

      if cursor.to_s.start_with?('next_page:')
        parsed = cursor.to_s.split(':').last.to_i
        return parsed if parsed.positive?
      end

      1
    end

    def ingest_single_message(client, token, account, folder_id, direction, msg)
      return false if msg[:message_id].blank?

      existing = Sales::EmailMessage.find_by(
        sales_email_account_id: account.id,
        provider_message_id: msg[:message_id].to_s
      )
      return false if existing

      if direction == 'inbound'
        ingestion = Sales::EmailInbound::IngestionService.new(
          email_account: account,
          folder_id: folder_id,
          msg_data: msg,
          client: client,
          access_token: token
        )
        created = ingestion.ingest!
        return created.present?
      end

      occurred_at = if msg[:received_time].present?
                      Time.at(msg[:received_time].to_i / 1000.0) rescue Time.current
                    else
                      Time.current
                    end

      thread = EmailSync::ThreadMatcher.resolve_or_create_thread(
        email_account: account,
        provider_thread_id: msg[:thread_id],
        subject: msg[:subject],
        occurred_at: occurred_at
      )

      from_email = (msg[:from] || '').downcase.strip
      to_email = (msg[:to] || '').downcase.strip

      crm_match = EmailSync::CRMMessageMatcher.match(company_id: account.company_id, email_address: to_email)

      Sales::EmailMessage.create!(
        company_id: account.company_id,
        sales_email_account_id: account.id,
        sales_email_thread_id: thread.id,
        sales_account_id: thread.sales_account_id || crm_match[:account_id],
        sales_contact_id: thread.sales_contact_id || crm_match[:contact_id],
        sales_opportunity_id: thread.sales_opportunity_id || crm_match[:opportunity_id],
        sender_user_id: account.user_id,
        from_email: from_email.presence || account.email,
        to_email: to_email.presence || 'cliente@destino.com',
        subject: msg[:subject].presence || '(Sem assunto)',
        body_text: msg[:summary].to_s,
        status: 'sent',
        direction: 'outbound',
        delivery_status: 'delivered',
        provider_message_id: msg[:message_id].to_s,
        provider_folder_id: folder_id.to_s,
        provider_received_at: occurred_at,
        created_at: occurred_at
      )
      thread.update!(last_message_at: [thread.last_message_at, occurred_at].compact.max, message_count: thread.messages.count)
      true
    rescue StandardError => e
      account.increment!(:messages_failed) if account&.persisted?
      Rails.logger.warn("[SyncEmailAccountJob] Skipping message #{msg[:message_id]} for account #{account&.id}: #{e.class} - #{e.message}")
      false
    end

    def reconcile_account_threads_and_counters!(account, imported_delta, status:, error:, connection_status: nil)
      return unless account&.persisted?

      # Reconcilia threads que possuam mensagens desta conta mas estejam sem sales_email_account_id
      orphan_thread_ids = Sales::EmailMessage.where(sales_email_account_id: account.id)
                                             .where.not(sales_email_thread_id: nil)
                                             .distinct
                                             .pluck(:sales_email_thread_id)
      if orphan_thread_ids.any?
        Sales::EmailThread.where(id: orphan_thread_ids, sales_email_account_id: nil)
                          .update_all(sales_email_account_id: account.id)
      end

      actual_stored = Sales::EmailMessage.where(sales_email_account_id: account.id).count
      reconciled_total = [account.messages_imported.to_i + imported_delta.to_i, actual_stored].max

      attrs = {
        sync_status: status,
        sync_error: error,
        messages_imported: reconciled_total
      }
      attrs[:connection_status] = connection_status if connection_status.present?
      attrs[:connection_status] = 'healthy' if status == 'healthy' && connection_status.nil?
      attrs[:last_synced_at] = Time.current if status == 'healthy' || imported_delta.to_i.positive?

      account.update!(attrs)
    rescue StandardError => e
      Rails.logger.error("[SyncEmailAccountJob] Counter reconciliation error for account #{account&.id}: #{e.message}")
    end
  end
end
