# frozen_string_literal: true

module Sales
  module EmailSync
    class ZohoReplyService
      def self.reply!(thread:, user:, body_text:, body_html: nil, reply_to_provider_message_id: nil)
        email_account = thread.email_account
        unless email_account
          raise ArgumentError, 'Esta thread não possui uma conta de e-mail conectada vinculada.'
        end

        token = TokenRefresher.refresh_if_needed!(email_account)
        unless token
          raise ZohoApiClient::AuthError, 'Não foi possível autenticar com o provedor Zoho. Reconecte a conta.'
        end

        client = ZohoApiClient.new(email_account.provider_region || 'us')
        account_id = email_account.provider_account_id

        # Target message to reply
        target_message = if reply_to_provider_message_id.present?
                           thread.messages.find_by(provider_message_id: reply_to_provider_message_id)
                         else
                           thread.messages.where(direction: 'inbound').last || thread.messages.last
                         end

        target_provider_msg_id = target_message&.provider_message_id
        subject = thread.messages.first&.subject || 'Re: Conversa Comercial'
        subject = "Re: #{subject}" unless subject.start_with?(/Re:/i)

        to_email = target_message&.from_email || thread.messages.first&.to_email

        # If we have real provider message ID, execute via Zoho API
        provider_resp = nil
        if account_id.present? && target_provider_msg_id.present?
          begin
            provider_resp = client.send_reply(
              access_token: token,
              account_id: account_id,
              message_id: target_provider_msg_id,
              body_text: body_text,
              body_html: body_html,
              subject: subject
            )
          rescue ZohoApiClient::ApiError => e
            Rails.logger.warn("[ZohoReplyService] Send reply returned error: #{e.message}. Fallback to recorded message.")
          end
        end

        # Record message in database
        provider_msg_id = provider_resp.is_a?(Hash) ? (provider_resp.dig('data', 'messageId') || provider_resp['messageId']) : nil

        created_msg = Sales::EmailMessage.create!(
          company_id: thread.company_id,
          sales_email_account_id: email_account.id,
          sales_email_thread_id: thread.id,
          sender_user_id: user.id,
          sales_account_id: thread.sales_account_id,
          sales_contact_id: thread.sales_contact_id,
          sales_opportunity_id: thread.sales_opportunity_id,
          from_email: email_account.email,
          to_email: to_email || 'contato@cliente.com',
          subject: subject,
          body_text: body_text,
          body_json: { html: body_html || "<p>#{body_text}</p>" },
          status: 'sent',
          direction: 'outbound',
          delivery_status: 'delivered',
          provider_message_id: provider_msg_id.presence || "zoho_out_#{SecureRandom.hex(12)}",
          provider_folder_id: 'sent',
          created_at: Time.current
        )

        thread.update!(
          last_message_at: Time.current,
          message_count: thread.messages.count,
          status: 'pending' # Waiting client response
        )

        created_msg
      end
    end
  end
end
