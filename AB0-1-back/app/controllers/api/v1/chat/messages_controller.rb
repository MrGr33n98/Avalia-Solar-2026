# frozen_string_literal: true

module Api
  module V1
    module Chat
      class MessagesController < BaseController
        before_action :find_session
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

          # Process through orchestrator
          result = ::Chat::OrchestratorService.process(
            session: @session,
            user_message: content
          )

          render json: result, status: :created
        rescue StandardError => e
          Rails.logger.error("[Chat::Messages] Error: #{e.class} - #{e.message}")
          Sentry.capture_exception(e) if defined?(Sentry)

          render json: {
            message: {
              id: nil,
              role: 'assistant',
              content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
              intent_detected: nil,
              created_at: Time.current
            }
          }, status: :ok # Return 200 even on error so frontend doesn't break
        end

        # POST /api/v1/chat/messages/:id/feedback
        def feedback
          message = ChatMessage.find(params[:id])
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

        def find_session
          @session = ChatSession.find(params[:session_id])
        end

        def check_rate_limit
          rate_limit = ENV.fetch('CHAT_RATE_LIMIT_PER_MINUTE', '30').to_i
          cache_key = "chat_rate:#{request.remote_ip}:#{Time.current.beginning_of_minute.to_i}"

          count = Rails.cache.increment(cache_key, 1, expires_in: 1.minute, raw: true) || 1

          if count.to_i > rate_limit
            ::Chat::PosthogTrackingService.track(
              event: 'chat_rate_limited',
              properties: { ip: request.remote_ip, session_id: @session.id }
            )

            render_error_response(
              message: 'Muitas mensagens. Aguarde um momento.',
              status: :too_many_requests,
              code: 'RATE_LIMITED',
              retry_after: 60
            )
          end
        end
      end
    end
  end
end
