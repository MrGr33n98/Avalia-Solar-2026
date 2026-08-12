# frozen_string_literal: true

module Api
  module V1
    module Chat
      class MessagesController < BaseController
        include ActionController::Live
        include ChatSessionAuthorization

        before_action :find_session
        before_action :authorize_session!, only: [:create]
        before_action :check_rate_limit, only: [:create]

        # POST /api/v1/chat/sessions/:session_id/messages
        def create
          content = params[:content].to_s.strip

          if content.blank?
            return render_error_response(
              message: 'Mensagem não pode ser vazia.',
              status: :unprocessable_entity,
              code: 'EMPTY_MESSAGE'
            )
          end

          # Check session message limit
          max_messages = ENV.fetch('CHAT_MAX_MESSAGES_PER_SESSION', '50').to_i
          if @session.message_count >= max_messages
            return render_error_response(
              message: 'Limite de mensagens atingido para esta sessão.',
              status: :too_many_requests,
              code: 'SESSION_MESSAGE_LIMIT'
            )
          end

          response.headers['Content-Type'] = 'text/event-stream'
          response.headers['Last-Modified'] = Time.now.httpdate
          # Disable Rack::ETag to prevent buffering
          response.headers['ETag'] = nil
          response.headers['Cache-Control'] = 'no-cache'

          sse = ActionController::Live::SSE.new(response.stream, event: 'message')

          begin
            # Process through orchestrator with streaming
            ::Chat::OrchestratorService.process(
              session: @session,
              user_message: content
            ) do |chunk, is_final, metadata|
              payload = { chunk: chunk }
              payload[:is_final] = true if is_final
              payload[:metadata] = metadata if metadata.present?
              sse.write(payload)
            end
          rescue StandardError => e
            Rails.logger.error("[Chat::Messages] Error: #{e.class} - #{e.message}")
            Sentry.capture_exception(e) if defined?(Sentry)
            sse.write({ chunk: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', is_final: true,
                        error: true })
          ensure
            sse.close
          end
        end

        # POST /api/v1/chat/messages/:id/feedback
        def feedback
          message = ChatMessage.find(params[:id])
          return unless authorize_chat_session!(message.chat_session)
          feedback_value = params[:feedback].to_i

          unless [-1, 0, 1].include?(feedback_value)
            return render_error_response(
              message: 'Feedback inválido. Use -1, 0 ou 1.',
              status: :unprocessable_entity,
              code: 'INVALID_FEEDBACK'
            )
          end

          message.update!(feedback: feedback_value)

          render json: { success: true, feedback: feedback_value }
        end

        private

        def authorize_session!
          return unless authorize_chat_session!(@session)
          @session.update!(user_id: current_user.id) if current_user && @session.user_id.nil?
        end

        def find_session
          @session = ChatSession.find(params[:session_id])
        end

        def check_rate_limit
          result = ::Chat::RateLimitService.check(session: @session, ip: request.remote_ip,
                                                   user_id: current_user&.id)
          return if result.allowed

          ::Chat::PosthogTrackingService.track(
            event: 'chat_rate_limited',
            properties: { ip: request.remote_ip, session_id: @session.id, code: result.code }
          )

          render_error_response(
            message: 'Muitas mensagens. Aguarde um momento.',
            status: :too_many_requests,
            code: result.code,
            retry_after: result.retry_after
          )
        end
      end
    end
  end
end
