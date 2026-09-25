# frozen_string_literal: true

module T
  class EmailTrackingController < ActionController::Base
    GIF_1X1 = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b".b.freeze

    skip_forgery_protection only: :unsubscribe

    def open
      email = ::Sales::EmailMessage.find_by(tracking_token: params[:token])
      email&.register_event!(event_type: 'open', user_agent: request.user_agent,
                              payload: { ip: request.remote_ip }) if email&.open_tracking_enabled
      send_data GIF_1X1, type: 'image/gif', disposition: 'inline'
    end

    def unsubscribe
      claims = ::Sales::Messaging::UnsubscribeToken.verify(params[:token])&.with_indifferent_access
      email = ::Sales::EmailMessage.find_by(id: claims&.fetch(:email_message_id, nil),
                                            company_id: claims&.fetch(:company_id, nil))
      return render plain: 'Link de preferências inválido ou expirado.', status: :not_found unless email

      if request.post?
        ::Sales::EmailSuppression.find_or_create_by!(company_id: email.company_id, email: email.to_email) do |item|
          item.reason = 'unsubscribe'
          item.suppressed_at = Time.current
        end
        ::Sales::EmailSequences::EnrollmentProcessor.stop_for_contact(contact: email.contact, reason: 'unsubscribe') if email.contact
        return head :no_content
      end

      render html: unsubscribe_confirmation(email).html_safe
    rescue ActiveSupport::MessageVerifier::InvalidSignature, TypeError
      render plain: 'Link de preferências inválido ou expirado.', status: :not_found
    end

    def click
      link = ::Sales::EmailLink.includes(:email_message).find_by(token: params[:token])
      target_url = link&.original_url
      unless link && ::Sales::Messaging::TrackingRewriter.safe_url?(target_url)
        return redirect_to '/', allow_other_host: false
      end

      link.increment!(:click_count)
      link.update_columns(first_clicked_at: Time.current) if link.first_clicked_at.blank?
      link.update_columns(last_clicked_at: Time.current)
      link.email_message.register_event!(event_type: 'click', url: target_url,
                                          user_agent: request.user_agent,
                                          payload: { ip: request.remote_ip, link_id: link.id })
      redirect_to target_url, allow_other_host: true
    end

    private

    def unsubscribe_confirmation(email)
      token = ERB::Util.html_escape(params[:token])
      address = ERB::Util.html_escape(email.to_email)
      <<~HTML
        <!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Preferências de e-mail</title>
        <main><h1>Cancelar e-mails</h1><p>Confirme o cancelamento de mensagens para #{address}.</p>
        <form action="/t/email/unsubscribe/#{token}" method="post"><button type="submit">Cancelar inscrição</button></form></main>
        </html>
      HTML
    end
  end
end
