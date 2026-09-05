# frozen_string_literal: true

module Sales
  class CampaignBatchProcessorJob < ApplicationJob
    queue_as :default

    def perform(campaign_id, recipient_ids)
      campaign = ::Sales::Campaign.find_by(id: campaign_id)
      return unless campaign && %w[dispatching scheduled].include?(campaign.status)

      recipients = ::Sales::CampaignRecipient.where(id: recipient_ids, sales_campaign_id: campaign_id, status: %w[pending failed])
      return if recipients.empty?

      template = campaign.email_template
      unless template && template.body_html.present?
        Rails.logger.error("[CampaignBatchProcessorJob] Abortando: Campanha ##{campaign.id} não possui template ou corpo HTML configurado.")
        campaign.update!(status: 'failed')
        return
      end

      sender_id = campaign.user_id || campaign.company&.users&.first&.id
      unless sender_id
        Rails.logger.error("[CampaignBatchProcessorJob] Abortando: Nenhum remetente válido associado à campanha ##{campaign.id}.")
        campaign.update!(status: 'failed')
        return
      end

      from_email = campaign.company.try(:email).presence || 'contato@avaliasolar.com.br'

      recipients.each do |recipient|
        # Reload campaign status to respect pause/cancel in real-time
        campaign.reload
        break unless campaign.status == 'dispatching'

        begin
          email_message = ::Sales::EmailMessage.create!(
            company_id: campaign.company_id,
            sales_campaign_id: campaign.id,
            sales_campaign_recipient_id: recipient.id,
            sales_account_id: recipient.sales_account_id,
            sales_contact_id: recipient.sales_contact_id,
            sender_user_id: sender_id,
            from_email: from_email,
            to_email: recipient.email,
            subject: template.subject_template.presence || campaign.name,
            body_html: template.body_html,
            body_json: template.body_json || {},
            status: 'queued'
          )

          # Send email
          ::Sales::SendEmailJob.perform_now(email_message.id)
          recipient.mark_sent!(email_message)
        rescue StandardError => e
          Rails.logger.error("[CampaignBatchProcessorJob] Erro ao enviar para #{recipient.email}: #{e.message}")
          recipient.mark_failed!(e.message)
        end
      end
    end
  end
end
