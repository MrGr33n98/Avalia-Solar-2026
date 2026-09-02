module Api
  module V1
    module Sales
      class EmailEventsController < BaseController
        skip_before_action :authenticate_api_user, only: [:create]

        def create
          provider_msg_id = params[:provider_message_id] || params.dig(:mail, :messageId)
          event_type = params[:event_type] || params[:eventType] || 'delivered'

          email = ::Sales::EmailMessage.find_by(provider_message_id: provider_msg_id)
          if email
            email.register_event!(
              event_type: event_type,
              provider_event_id: params[:event_id] || SecureRandom.uuid,
              url: params[:url],
              user_agent: request.user_agent,
              occurred_at: Time.current,
              payload: params.to_unsafe_h
            )
            render json: { status: 'event_processed' }, status: :ok
          else
            render json: { status: 'email_not_found' }, status: :not_found
          end
        end
      end
    end
  end
end
