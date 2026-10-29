# frozen_string_literal: true

module Sales
  module EmailInbound
    class IngestionService
      attr_reader :email_account, :folder_id, :msg_data, :client, :access_token

      def initialize(email_account:, folder_id:, msg_data:, client: nil, access_token: nil)
        @email_account = email_account
        @folder_id = folder_id
        @msg_data = msg_data
        @client = client
        @access_token = access_token
      end

      def ingest!
        return nil if msg_data[:message_id].blank?

        # Deduplicação idempotente por conta e message_id do provedor
        existing = Sales::EmailMessage.find_by(
          sales_email_account_id: email_account.id,
          provider_message_id: msg_data[:message_id]
        )
        return existing if existing

        occurred_at = parse_occurred_at(msg_data[:received_time])
        from_email = (msg_data[:from] || '').downcase.strip
        to_email = (msg_data[:to] || '').downcase.strip
        subject = msg_data[:subject] || '(Sem assunto)'

        # 1. Buscar Headers RFC via API se cliente disponível
        rfc_headers = {}
        if client && access_token && email_account.provider_account_id
          rfc_headers = client.fetch_message_headers(
            access_token: access_token,
            account_id: email_account.provider_account_id,
            folder_id: folder_id,
            message_id: msg_data[:message_id]
          )
        end

        # 2. Executar ReplyMatcher determinístico
        matcher = ReplyMatcher.new(
          company_id: email_account.company_id,
          email_account: email_account,
          headers: rfc_headers,
          from_email: from_email,
          to_email: to_email,
          subject: subject,
          occurred_at: occurred_at,
          provider_thread_id: msg_data[:thread_id]
        )
        match_result = matcher.match

        # 3. Classificar se é resposta humana ou autoresponder/bounce
        classification = classify_inbound(subject, rfc_headers, msg_data[:summary])

        # 4. Transação Atômica de Ingestão
        ActiveRecord::Base.transaction do
          # Resolver ou criar thread canônica
          thread = resolve_thread(match_result, msg_data[:thread_id], subject, occurred_at)

          # Ingerir a mensagem inbound
          inbound_message = Sales::EmailMessage.create!(
            company_id: email_account.company_id,
            sales_email_account_id: email_account.id,
            sales_email_thread_id: thread.id,
            parent_email_message_id: match_result[:parent_message]&.id,
            reply_mailbox_id: email_account.id,
            sales_account_id: match_result[:sales_account_id] || thread.sales_account_id,
            sales_contact_id: match_result[:sales_contact_id] || thread.sales_contact_id,
            sales_opportunity_id: match_result[:sales_opportunity_id] || thread.sales_opportunity_id,
            from_email: from_email.presence || 'desconhecido@cliente.com',
            to_email: to_email.presence || email_account.email,
            subject: subject,
            body_text: msg_data[:summary] || '',
            status: 'received',
            direction: 'inbound',
            delivery_status: 'delivered',
            provider_message_id: msg_data[:message_id],
            provider_folder_id: folder_id,
            rfc_message_id: rfc_headers[:message_id],
            in_reply_to_header: rfc_headers[:in_reply_to],
            references_header: rfc_headers[:references],
            inbound_classification: classification[:type],
            classification_reason: classification[:reason],
            provider_received_at: occurred_at,
            created_at: occurred_at
          )

          # Se casou com um outbound original
          if match_result[:status] == :matched && match_result[:parent_message]
            parent = match_result[:parent_message]

            # Emitir evento replied no outbound original uma única vez
            if classification[:type] == 'human_reply'
              parent.register_event!(
                event_type: 'replied',
                source: 'inbound_email',
                occurred_at: occurred_at,
                provider_event_id: "inbound_reply_#{inbound_message.id}"
              )

              # Interromper cadência de follow-up ativa para esse contato
              stop_sequences_for_contact(parent.contact) if parent.contact
            end
          end

          thread.update!(last_message_at: [thread.last_message_at, occurred_at].compact.max, message_count: thread.messages.count)
          emit_inbound_notification(inbound_message, thread, classification[:type])
          inbound_message
        end
      end

      private

      def emit_inbound_notification(inbound_message, thread, classification_type)
        return unless email_account.user_id.present?
        return if classification_type == 'bounce'

        notif_type = inbound_message.parent_email_message_id.present? ? 'reply_received' : 'new_message'
        title = inbound_message.parent_email_message_id.present? ? "Resposta recebida de #{inbound_message.from_email}" : "Novo e-mail de #{inbound_message.from_email}"

        ::Notification.create!(
          user_id: email_account.user_id,
          company_id: email_account.company_id,
          notification_type: notif_type,
          category: 'messages',
          title: title.truncate(140),
          body: "#{inbound_message.subject} — #{inbound_message.body_text.to_s.truncate(120)}",
          delivery_channels: ['in_app'],
          sent_at: Time.current
        )
      rescue StandardError => e
        Rails.logger.warn("[IngestionService] Falha ao criar notificacao in-app para #{inbound_message.id}: #{e.message}")
      end

      def parse_occurred_at(timestamp)
        return Time.current if timestamp.blank?
        Time.at(timestamp.to_i / 1000.0) rescue Time.current
      end

      def resolve_thread(match_result, provider_thread_id, subject, occurred_at)
        if match_result[:status] == :matched && match_result[:sales_email_thread_id]
          thread = Sales::EmailThread.find_by(id: match_result[:sales_email_thread_id])
          return thread if thread
        end

        # Fallback para thread matcher
        Sales::EmailSync::ThreadMatcher.resolve_or_create_thread(
          email_account: email_account,
          provider_thread_id: provider_thread_id,
          subject: subject,
          occurred_at: occurred_at
        )
      end

      def classify_inbound(subject, headers, summary)
        subj = subject.to_s.downcase
        raw = headers[:raw] || {}
        auto_submitted = raw['auto-submitted'].to_s.downcase

        if auto_submitted.present? && auto_submitted != 'no'
          return { type: 'automatic_reply', reason: { auto_submitted_header: auto_submitted } }
        end

        if subj.include?('out of office') || subj.include?('ausência temporária') || subj.include?('resposta automática') || subj.include?('férias')
          return { type: 'automatic_reply', reason: { subject_match: subj } }
        end

        if subj.include?('delivery status notification') || subj.include?('failure notice') || subj.include?('undelivered mail')
          return { type: 'bounce', reason: { dsn_bounce: true } }
        end

        { type: 'human_reply', reason: { default: true } }
      end

      def stop_sequences_for_contact(contact)
        return unless defined?(Sales::EmailSequenceEnrollment)

        enrollments = Sales::EmailSequenceEnrollment.where(
          sales_contact_id: contact.id,
          status: 'active'
        )

        enrollments.each do |enrollment|
          enrollment.update!(
            status: 'completed',
            stop_reason: 'replied_to_email',
            stopped_at: Time.current
          )
        end
      rescue StandardError => e
        Rails.logger.warn("[IngestionService] Failed to stop sequences for contact #{contact.id}: #{e.message}")
      end
    end
  end
end
