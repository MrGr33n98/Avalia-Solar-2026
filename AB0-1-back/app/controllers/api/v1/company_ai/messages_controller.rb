# frozen_string_literal: true

module Api
  module V1
    module CompanyAi
      class MessagesController < Api::V1::BaseController
        include ::ChatSessionAuthorization

        before_action :find_session
        before_action :authorize_session!
        before_action :check_rate_limit

        def create
          result = ::CompanyAi::MessageProcessor.call(
            session: @session, content: params[:content], request_id: request_id,
            client_message_id: params[:client_message_id]
          )
          response.headers['Cache-Control'] = 'private, no-store'
          render json: serialize(result), status: :ok
        rescue ::CompanyAi::MessageProcessor::InvalidMessage => e
          render_error_response(message: 'Mensagem inválida.', status: :unprocessable_entity, code: e.code)
        rescue ::CompanyAi::MessageProcessor::Unavailable => e
          render_error_response(message: 'Assistente indisponível.', status: :forbidden, code: e.code)
        rescue ::CompanyAi::UsageLedger::QuotaExceeded
          render_error_response(message: 'Limite mensal do assistente atingido.', status: :too_many_requests,
                                code: 'COMPANY_AI_QUOTA_EXCEEDED')
        end

        private

        def find_session
          @session = ::ChatSession.find(params[:session_id])
          return if params[:id].to_s == @session.company_id.to_s && @session.vertical == 'company_ai'

          render_error_response(message: 'Sessão não pertence à empresa informada.', status: :forbidden,
                                code: 'TENANT_SCOPE_MISMATCH')
        end

        def authorize_session!
          return if performed? || !@session

          authorize_chat_session!(@session)
        end

        def check_rate_limit
          return if performed? || !@session
          return if ::CompanyAi::SessionRateLimiter.allowed?(ip: request.remote_ip, company_id: @session.company_id)

          render_error_response(message: 'Muitas mensagens. Aguarde um momento.', status: :too_many_requests,
                                code: 'COMPANY_AI_RATE_LIMITED', retry_after: 60)
        end

        def request_id
          params[:request_id].to_s.presence || request.headers['X-Request-ID'].to_s.presence || SecureRandom.hex(16)
        end

        def serialize(result)
          {
            session_id: @session.id,
            idempotent: result.idempotent,
            awaiting_agent: result.awaiting_agent,
            user_message: serialize_message(result.user_message),
            assistant_message: serialize_message(result.assistant_message),
            action: result.action
          }.compact
        end

        def serialize_message(message)
          return nil unless message

          { id: message.id, role: message.role, content: message.content, created_at: message.created_at }
        end
      end
    end
  end
end
