module Api
  module V1
    module Sales
      class TrackingEventsController < BaseController
        MAX_PAYLOAD_BYTES = 16.kilobytes
        ALLOWED_EVENTS = %w[
          page_view company_view cta_click quote_request_started quote_request_submitted
          form_started form_submitted email_sent email_delivered email_opened email_clicked
          email_replied email_bounced email_complained campaign_enrolled sequence_enrolled
          sequence_step_completed lead_created lead_converted opportunity_stage_changed
          opportunity_won opportunity_lost
        ].freeze

        def create
          return render_oversized_payload if request.raw_post.bytesize > MAX_PAYLOAD_BYTES

          attributes = event_params
          session = scoped_sessions.find_by!(session_id: attributes.delete(:session_id))
          return render_invalid_event unless ALLOWED_EVENTS.include?(attributes[:event_name])

          event = ::Sales::TrackingEvent.create!(attributes.merge(
            account_id: session.account_id,
            contact_id: session.contact_id,
            session_id: session.session_id,
            path: safe_path(attributes[:path]),
            properties: safe_properties(attributes[:properties]),
            occurred_at: Time.current
          ))
          render json: { event_id: event.id }, status: :accepted
        end

        private

        def event_params
          params.require(:event).permit(:session_id, :event_name, :path, properties: {})
        end

        def scoped_sessions
          ::Sales::TrackingSession.where(account_id: current_tenant_scope.accounts.select(:id))
        end

        def safe_path(value)
          path = URI.parse(value.to_s).path
          path.to_s.start_with?('/') ? path.first(500) : nil
        rescue URI::InvalidURIError
          nil
        end

        def safe_properties(value)
          return {} unless value.is_a?(ActionController::Parameters) || value.is_a?(Hash)

          value.to_unsafe_h.first(30).each_with_object({}) do |(key, item), safe|
            next unless key.to_s.match?(/\A[a-zA-Z0-9_.-]{1,80}\z/)
            next if key.to_s.match?(/email|phone|name|token|password|secret|authorization/i)
            next unless item.is_a?(String) || item.is_a?(Numeric) || item == true || item == false

            safe[key.to_s] = item.is_a?(String) ? item.first(500) : item
          end
        end

        def render_invalid_event
          render_error_response(message: 'Evento de tracking não permitido.', status: :unprocessable_entity,
                                code: 'TRACKING_EVENT_NOT_ALLOWED')
        end

        def render_oversized_payload
          render_error_response(message: 'Payload de tracking excede o limite.', status: :unprocessable_entity,
                                code: 'TRACKING_PAYLOAD_TOO_LARGE')
        end
      end
    end
  end
end
