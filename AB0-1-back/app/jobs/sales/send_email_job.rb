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

      # 2. Multi-Provider Dispatch (Zoho connected mailbox -> AWS SES -> Brevo fallback)
      result = nil
      dispatch_source = nil

      # A. Se o vendedor possui conta de e-mail conectada (Zoho Mail - Opção A)
      connected_account = ::Sales::EmailAccount.connected.find_by(
        user_id: email.sender_user_id
      ) if email.sender_user_id.present?

      if connected_account.present? && connected_account.provider_account_id.present?
        begin
          token = ::Sales::EmailSync::TokenRefresher.refresh_if_needed!(connected_account)
          if token
            client = ::Sales::EmailSync::ZohoApiClient.new(connected_account.provider_region || 'us')
            provider_resp = if email.in_reply_to.present?
                              client.send_reply(
                                access_token: token,
                                account_id: connected_account.provider_account_id,
                                message_id: email.in_reply_to,
                                body_text: email.body_text,
                                body_html: email.body_html,
                                subject: email.subject
                              )
                            else
                              client.send_mail(
                                access_token: token,
                                account_id: connected_account.provider_account_id,
                                from: connected_account.email,
                                to: email.to_email,
                                subject: email.subject,
                                body_text: email.body_text,
                                body_html: email.body_html,
                                cc: email.cc,
                                bcc: email.bcc
                              )
                            end
            provider_msg_id = provider_resp.is_a?(Hash) ? (provider_resp.dig('data', 'messageId') || provider_resp['messageId']) : nil
            result = ::Sales::Messaging::Providers::Base::Result.new(
              success?: true,
              provider_message_id: provider_msg_id.presence || "zoho_#{SecureRandom.hex(12)}"
            )
            dispatch_source = 'zoho_mail_api'
          end
        rescue StandardError => e
          Rails.logger.warn("[SendEmailJob] Envio via conta Zoho falhou: #{e.message}. Tentando SES/Brevo fallback.")
        end
      end

      # B. Provedor Primário: AWS SES (quando não enviado via Zoho)
      if result.nil? || !result.success?
        access_key = ENV['AWS_ACCESS_KEY_ID'].to_s
        spaces_key = ENV['SPACES_ACCESS_KEY_ID'].to_s
        is_spaces_fallback = access_key.present? && spaces_key.present? && access_key == spaces_key

        # Se as credenciais não forem espelho do Spaces da DigitalOcean
        unless is_spaces_fallback
          provider = ::Sales::Messaging::Providers::Ses.new
          ses_result = provider.send_message(email)
          if ses_result.success?
            result = ses_result
            dispatch_source = 'aws_ses_api'
          else
            Rails.logger.warn("[SendEmailJob] Envio SES falhou: #{ses_result.error_message}. Tentando Brevo fallback.")
          end
        end
      end

      # C. Fallback: Brevo API (SMTP) quando SES não configurado ou falhou
      if (result.nil? || !result.success?) && ENV['BREVO_API_KEY'].present?
        brevo_provider = ::Sales::Messaging::Providers::Brevo.new
        brevo_result = brevo_provider.send_message(email)
        if brevo_result.success?
          result = brevo_result
          dispatch_source = 'brevo_api'
        else
          result ||= brevo_result
        end
      end

      # Se ainda sem resultado (ex: sem Brevo configurado), chama SES padrão para registrar o resultado
      if result.nil?
        result = ::Sales::Messaging::Providers::Ses.new.send_message(email)
        dispatch_source = 'aws_ses_api'
      end

      if result.success?
        now = Time.current
        email.update!(
          status: 'sent',
          delivery_status: 'sent',
          provider_message_id: result.provider_message_id,
          sent_at: now,
          metadata: (email.metadata || {}).except('error').merge('provider' => dispatch_source)
        )

        begin
          email.register_event!(
            event_type: 'provider_accepted',
            source: dispatch_source || 'legacy',
            dedupe_key: "provider-accepted:#{result.provider_message_id}",
            occurred_at: now,
            payload: { provider_message_id: result.provider_message_id, source: dispatch_source }
          )
        rescue StandardError => ev_err
          Rails.logger.warn("[SendEmailJob] Falha ao registrar evento de envio: #{ev_err.message}")
        end

        safely_advance_sequence(email)
      else
        error_msg = result.error_message.presence || 'Falha no provedor de envio'
        email.update!(status: 'failed', delivery_status: 'failed',
                      metadata: (email.metadata || {}).merge('error' => error_msg, 'provider' => dispatch_source))
        begin
          email.register_event!(
            event_type: 'failed',
            source: dispatch_source || 'legacy',
            dedupe_key: "failed:#{email.id}:#{email.updated_at.to_i}",
            occurred_at: Time.current,
            payload: { error: error_msg }
          )
        rescue StandardError => ev_err
          Rails.logger.warn("[SendEmailJob] Falha ao registrar evento de falha: #{ev_err.message}")
        end
        safely_fail_sequence_step(email)
      end
    rescue ::Sales::Messaging::Renderer::EmailRenderError => e
      Rails.logger.error({ event: 'sales_email_render_failed', email_message_id: email&.id,
                           tenant_id: email&.company_id, error_class: e.class.name }.to_json)
      email&.update!(status: 'failed', delivery_status: 'failed',
                     metadata: (email.metadata || {}).merge('error' => e.class.name))
      safely_fail_sequence_step(email)
    rescue StandardError => e
      unless result&.success?
        email&.update!(status: 'failed', delivery_status: 'failed',
                       metadata: (email.metadata || {}).merge('error' => e.class.name))
        safely_fail_sequence_step(email)
      end
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
          email.update!(status: 'failed', delivery_status: 'failed',
                        metadata: (email.metadata || {}).merge('error' => 'SUPPRESSED_AT_SEND_TIME'))
          email.campaign_recipient&.update!(status: 'unsubscribed', error_message: 'SUPPRESSED_AT_SEND_TIME')
          suppressed = true
        else
          email.update!(status: 'sending', delivery_status: 'sending')
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
