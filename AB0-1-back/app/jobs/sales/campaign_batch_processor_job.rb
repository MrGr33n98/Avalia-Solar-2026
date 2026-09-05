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
            sender_user_id: campaign.user_id || campaign.company.users.first&.id || 1,
            from_email: from_email,
            to_email: recipient.email,
            subject: template&.subject_template || campaign.name,
            body_html: template&.body_html || "<p>Olá #{recipient.first_name}, confira as ofertas da #{campaign.company.name}.</p>",
            body_json: template&.body_json || {},
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
