# frozen_string_literal: true

module Sales
  class CampaignBatchProcessorJob < ApplicationJob
    queue_as :default

    def perform(campaign_id, recipient_ids)
      campaign = ::Sales::Campaign.find_by(id: campaign_id)
      return unless campaign && campaign.status == 'dispatching'

      recipients = ::Sales::CampaignRecipient.where(id: recipient_ids, sales_campaign_id: campaign_id, status: %w[pending failed])
      return if recipients.empty?

      template = campaign.email_template
      template_data = campaign.template_snapshot_present? ? campaign.template_snapshot : template_payload(template)
      unless template_data && (template_data['body_html'].present? || template_data['body_json'].present?)
        Rails.logger.error("[CampaignBatchProcessorJob] Abortando: Campanha ##{campaign.id} não possui template ou corpo configurado.")
        campaign.update!(status: 'failed')
        return
      end

      sender_id = campaign.user_id
      unless sender_id
        Rails.logger.error("[CampaignBatchProcessorJob] Abortando: Nenhum remetente válido (user_id ausente) na campanha ##{campaign.id}.")
        campaign.update!(status: 'failed')
        return
      end

      from_email = campaign.company.try(:email).presence || 'contato@avaliasolar.com.br'

      recipients.each do |recipient|
        # Reload campaign status to respect pause/cancel in real-time
        campaign.reload
        break unless campaign.status == 'dispatching'

        begin
          recipient.with_lock do
            existing_message = recipient.email_message
            if existing_message.present?
              if existing_message.status == 'sent' || existing_message.status == 'delivered'
                recipient.mark_sent!(existing_message)
                next
              elsif existing_message.status == 'failed'
                err_msg = existing_message.metadata.is_a?(Hash) ? existing_message.metadata['error'] : nil
                recipient.mark_failed!(err_msg.presence || "Mensagem falhou em tentativa anterior")
                next
              end
            end

            email_message = existing_message || begin
              ::Sales::EmailMessage.create_or_find_by!(sales_campaign_recipient_id: recipient.id) do |msg|
                msg.company_id = campaign.company_id
                msg.sales_campaign_id = campaign.id
                msg.sales_account_id = recipient.sales_account_id
                msg.sales_contact_id = recipient.sales_contact_id
                msg.sender_user_id = sender_id
                msg.from_email = from_email
                msg.to_email = recipient.email
                msg.subject = template_data['subject_template'].presence || campaign.name
                msg.body_html = template_data['body_html']
                msg.body_json = template_data['body_json'] || {}
                msg.status = 'queued'
              end
            rescue ActiveRecord::RecordNotUnique
              ::Sales::EmailMessage.find_by!(sales_campaign_recipient_id: recipient.id)
            end

            # Send email
            ::Sales::SendEmailJob.perform_now(email_message.id)
            email_message.reload
            if email_message.status == 'sent' || email_message.status == 'delivered'
              recipient.mark_sent!(email_message)
            elsif email_message.status == 'failed' && email_message.metadata.is_a?(Hash) && email_message.metadata['error'] == 'SUPPRESSED_AT_SEND_TIME'
              recipient.update!(status: 'unsubscribed', error_message: 'SUPPRESSED_AT_SEND_TIME')
            else
              err_msg = email_message.metadata.is_a?(Hash) ? email_message.metadata['error'] : nil
              recipient.mark_failed!(err_msg.presence || "Envio falhou com status '#{email_message.status}'")
            end
          end
        rescue StandardError => e
          Rails.logger.error("[CampaignBatchProcessorJob] Erro ao enviar para #{recipient.email}: #{e.message}")
          recipient.mark_failed!(e.message)
        end
      end
    end

    def template_payload(template)
      return nil unless template

      {
        'subject_template' => template.subject_template,
        'body_html' => template.body_html,
        'body_json' => template.body_json
      }
    end
  end
end
