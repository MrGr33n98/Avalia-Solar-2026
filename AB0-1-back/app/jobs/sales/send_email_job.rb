module Sales
  class SendEmailJob < ApplicationJob
    queue_as :default

    def perform(email_message_id)
      email = ::Sales::EmailMessage.find_by(id: email_message_id)
      return unless email && (email.status == 'queued' || email.status == 'draft')

      # 1. Render through Fail-Closed Renderer
      rendered = ::Sales::Messaging::Renderer.render(
        body_json: email.body_json,
        raw_html: body_with_signature(email),
        raw_text: text_with_signature(email),
        subject: email.subject,
        to_email: email.to_email,
        context: {
          contact: email.contact,
          account: email.account,
          opportunity: email.opportunity,
          user: email.sender_user
        }
      )

      email.update!(
        subject: rendered[:subject],
        body_html: rendered[:body_html],
        body_text: rendered[:body_text]
      )

      # 2. Provider Dispatch (Real AWS SES / Provider driver)
      provider = ::Sales::Messaging::Providers::Ses.new
      result = provider.send_message(email)

      if result.success?
        now = Time.current
        email.update!(
          status: 'sent',
          provider_message_id: result.provider_message_id,
          sent_at: now
        )

        email.register_event!(event_type: 'sent', provider_event_id: "evt-sent-#{email.id}", occurred_at: now)

        # 3. Timeline Activity Persistence
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
      else
        email.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => result.error_message))
        email.register_event!(event_type: 'failed', occurred_at: Time.current, payload: { error: result.error_message })
      end
    private

    def signature_for(email)
      scope = ::Sales::EmailSignature.where(user_id: email.sender_user_id, company_id: email.company_id)
      scope = scope.where(sales_email_account_id: email.sales_email_account_id) if email.sales_email_account_id.present?
      scope.find_by(is_default: true) || scope.where(sales_email_account_id: nil).find_by(is_default: true)
    end

    def body_with_signature(email)
      signature = signature_for(email)
      [email.body_html, signature&.body_html].compact.join('<br><br>')
    end

    def text_with_signature(email)
      signature = signature_for(email)
      signature_text = signature && ActionView::Base.full_sanitizer.sanitize(signature.body_html)
      [email.body_text, signature_text].compact.join("\n\n")
    end

    rescue ::Sales::Messaging::Renderer::EmailRenderError => e
      Rails.logger.error("[SendEmailJob] Fail-Closed Renderer bloqueou o envio: #{e.message}")
      email&.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => e.message))
    rescue StandardError => e
      email&.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => e.message))
      raise e
    end
  end
end
