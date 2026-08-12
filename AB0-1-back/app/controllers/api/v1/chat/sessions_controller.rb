# frozen_string_literal: true

module Api
  module V1
    module Chat
      class SessionsController < BaseController
        include ChatSessionAuthorization

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

          # Add initial greeting message based on vertical
          initial_content = if session.vertical == 'electric_mobility'
                              'Olá! Sou o MobiVolt AI, seu assistente para mobilidade elétrica. Como posso te ajudar com carregadores ou frotas hoje?'
                            elsif session.vertical == 'success'
                              'Olá! Sou o MobiVolt Success. Estou aqui para te ajudar no onboarding e no setup do seu perfil comercial. Como posso ajudar com seu cadastro ou configurações hoje?'
                            else
                              'Olá! Sou o MobiVolt AI, seu assistente para energia solar. Como posso te ajudar a economizar na conta de luz hoje?'
                            end

          initial_message = session.chat_messages.create!(
            role: 'assistant',
            content: initial_content,
            safety_status: 'clean'
          )

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
              access_token: Chat::SessionAccessToken.generate(session),
              visitor_id: session.visitor_id,
              status: session.status,
              vertical: session.vertical,
              message_count: session.message_count,
              realtime_token: realtime_token_for(session),
              started_at: session.started_at
            },
            messages: [
              {
                id: initial_message.id,
                role: initial_message.role,
                content: initial_message.content,
                created_at: initial_message.created_at
              }
            ]
          }, status: :created
        end

        # GET /api/v1/chat/sessions/:id
        def show
          session = ChatSession.find(params[:id])
          return unless authorize_chat_session!(session)
          messages = session.chat_messages.chronological.select(:id, :role, :content, :intent_detected, :metadata,
                                                                :created_at)

          render json: {
            id: session.id,
            status: session.status,
            message_count: session.message_count,
            realtime_token: realtime_token_for(session),
            access_token: Chat::SessionAccessToken.generate(session),
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

        def realtime_token_for(session)
          Rails.application.message_verifier(:chat_session_realtime).generate(session.id)
        end
      end
    end
  end
end
