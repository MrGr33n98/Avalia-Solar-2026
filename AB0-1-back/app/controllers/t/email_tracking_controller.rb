# frozen_string_literal: true

module T
  class EmailTrackingController < ActionController::Base
    GIF_1X1 = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b".b.freeze

    def open
      email = ::Sales::EmailMessage.find_by(tracking_token: params[:token])
      email&.register_event!(event_type: 'open', user_agent: request.user_agent,
                              payload: { ip: request.remote_ip }) if email&.open_tracking_enabled
      send_data GIF_1X1, type: 'image/gif', disposition: 'inline'
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
  end
end
