module Sales
  class SendEmailJob < ApplicationJob
    queue_as :default

    def perform(email_message_id)
      email = ::Sales::EmailMessage.find_by(id: email_message_id)
      return unless email && email.status == 'queued'

      # Simulate AWS SES dispatch / Mailer delivery safely
      provider_msg_id = "ses-msg-#{SecureRandom.uuid}"
      now = Time.current

      email.update!(
        status: 'sent',
        provider_message_id: provider_msg_id,
        sent_at: now
      )

      # Register email_sent activity in timeline
      ::Sales::Activity.create!(
        sales_account_id: email.sales_account_id,
        sales_contact_id: email.sales_contact_id,
        sales_opportunity_id: email.sales_opportunity_id,
        actor_id: email.sender_user_id,
        activity_type: 'email_sent',
        direction: 'outbound',
        subject: "E-mail Enviado: #{email.subject}",
        body: email.body_text || email.body_html,
        occurred_at: now
      )
    rescue StandardError => e
      email&.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => e.message))
      raise e
    end
  end
end
