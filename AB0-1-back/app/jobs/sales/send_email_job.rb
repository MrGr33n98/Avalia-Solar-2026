# frozen_string_literal: true

module Sales
  class SendEmailJob < ApplicationJob
    queue_as :default

    def perform(email_message_id)
      return unless ::Sales::Messaging::SendingGate.enabled?

      email, claimed, suppressed = claim_message(email_message_id)
      return unless email
      if suppressed
        stop_suppressed_sequence(email)
        return
      end
      return unless claimed

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

        # 3. Timeline Activity Persistence (support nil account/contact/opportunity)
        if email.sales_account_id.present? || email.sales_contact_id.present? || email.sales_opportunity_id.present?
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
        end
        safely_advance_sequence(email)
      else
        email.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => result.error_message))
        email.register_event!(event_type: 'failed', occurred_at: Time.current, payload: { error: result.error_message })
        safely_fail_sequence_step(email)
      end
    rescue ::Sales::Messaging::Renderer::EmailRenderError => e
      Rails.logger.error({ event: 'sales_email_render_failed', email_message_id: email&.id,
                           tenant_id: email&.company_id, error_class: e.class.name }.to_json)
      email&.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => e.class.name))
      safely_fail_sequence_step(email)
    rescue StandardError => e
      email&.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => e.class.name))
      safely_fail_sequence_step(email)
      raise e
    end

    private

    def claim_message(email_message_id)
      email = nil
      claimed = false
      suppressed = false
      ::Sales::EmailMessage.transaction do
        email = ::Sales::EmailMessage.lock.find_by(id: email_message_id)
        next unless email && %w[queued draft].include?(email.status)

        if ::Sales::Messaging::SuppressionChecker.blocked?(company_id: email.company_id, email: email.to_email)
          Rails.logger.warn("[SendEmailJob] Envio bloqueado por suppression para tenant #{email.company_id}.")
          email.update!(status: 'failed', metadata: (email.metadata || {}).merge('error' => 'SUPPRESSED_AT_SEND_TIME'))
          email.campaign_recipient&.update!(status: 'unsubscribed', error_message: 'SUPPRESSED_AT_SEND_TIME')
          suppressed = true
        else
          email.update!(status: 'sending')
          claimed = true
        end
      end
      [email, claimed, suppressed]
    end

    def stop_suppressed_sequence(email)
      return unless email.contact

      ::Sales::EmailSequences::EnrollmentProcessor.stop_for_contact(contact: email.contact, reason: 'suppressed')
    end

    def safely_advance_sequence(email)
      ::Sales::EmailSequences::EnrollmentProcessor.email_sent(email)
    rescue StandardError => e
      Rails.logger.error({ event: 'sales_sequence_advance_failed', enrollment_step_id: email.sales_email_sequence_enrollment_step_id,
                           error_class: e.class.name }.to_json)
    end

    def safely_fail_sequence_step(email)
      return unless email

      ::Sales::EmailSequences::EnrollmentProcessor.email_failed(email)
    rescue StandardError => e
      Rails.logger.error({ event: 'sales_sequence_failure_persist_failed', enrollment_step_id: email.sales_email_sequence_enrollment_step_id,
                           error_class: e.class.name }.to_json)
    end

    def signature_for(email)
      return nil unless email.sender_user_id.present? && email.company_id.present?

      scope = ::Sales::EmailSignature.where(user_id: email.sender_user_id, company_id: email.company_id)
      scope = scope.where(sales_email_account_id: email.sales_email_account_id) if email.sales_email_account_id.present?
      scope.find_by(is_default: true) || scope.where(sales_email_account_id: nil).find_by(is_default: true)
    end

    def body_with_signature(email)
      signature = signature_for(email)
      [email.body_html.presence || email.body_text, signature&.body_html].compact_blank.join('<br><br>')
    end

    def text_with_signature(email)
      signature = signature_for(email)
      signature_text = signature && ActionView::Base.full_sanitizer.sanitize(signature.body_html)
      [email.body_text.presence || email.body_html, signature_text].compact_blank.join("\n\n")
    end
  end
end
