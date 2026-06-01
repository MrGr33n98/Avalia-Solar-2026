# frozen_string_literal: true

module Api
  module V1
    module Chat
      class SessionsController < BaseController
        # POST /api/v1/chat/sessions
        def create
          unless chat_enabled?
            return render_error_response(
              message: 'Chat indisponível no momento.',
              status: :service_unavailable,
              code: 'CHAT_DISABLED'
            )
          end

          session = ChatSession.create!(session_params)

          # Track session creation
          ::Chat::PosthogTrackingService.track(
            event: 'chat_session_created',
            distinct_id: session.visitor_id,
            properties: {
              session_id: session.id,
              source_page: session.source_page,
              vertical: session.vertical,
              utm_source: session.utm_source,
              utm_campaign: session.utm_campaign
            }
          )

          render json: {
            session: {
              id: session.id,
              visitor_id: session.visitor_id,
              status: session.status,
              started_at: session.started_at
            },
            messages: []
          }, status: :created
        end

        # GET /api/v1/chat/sessions/:id
        def show
          session = ChatSession.find(params[:id])
          messages = session.chat_messages.chronological.select(:id, :role, :content, :intent_detected, :metadata, :created_at)

          render json: {
            id: session.id,
            status: session.status,
            message_count: session.message_count,
            messages: messages
          }
        end

        private

        def session_params
          params.permit(
            :visitor_id, :page_url, :source_page, :referrer,
            :utm_source, :utm_medium, :utm_campaign, :utm_term, :utm_content,
            :vertical
          ).merge(
            user_id: current_user&.id
          )
        end

        def chat_enabled?
          ENV.fetch('CHAT_ENABLED', 'true') == 'true'
        end
      end
    end
  end
end
