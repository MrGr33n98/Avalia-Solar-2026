# frozen_string_literal: true

module Api
  module V1
    module Sales
      class InboxRepliesController < BaseController
        before_action :set_thread

        # POST /api/v1/sales/email_threads/:email_thread_id/replies
        def create
          reply_params = params[:reply] || params
          body_text = (reply_params[:body_text].presence || reply_params[:body_html].presence).to_s.strip
          if body_text.blank?
            return render_error_response(message: 'Conteúdo da resposta não pode ficar em branco.', status: :unprocessable_entity, code: 'EMPTY_BODY')
          end

          idempotency_key = request.headers['Idempotency-Key'].presence || reply_params[:idempotency_key].presence || params[:idempotency_key].presence
          if idempotency_key.present?
            cache_k = "crm:inbox:reply:idemp:#{idempotency_key}"
            if Rails.cache.read(cache_k)
              return render_error_response(message: 'Resposta já processada.', status: :conflict, code: 'IDEMPOTENT_CONFLICT')
            end
            Rails.cache.write(cache_k, true, expires_in: 5.minutes)
          end

          message = ::Sales::EmailSync::ZohoReplyService.reply!(
            thread: @thread,
            user: current_user,
            body_text: body_text,
            body_html: reply_params[:body_html],
            cc: reply_params[:cc],
            bcc: reply_params[:bcc],
            reply_all: reply_params[:reply_all],
            reply_to_provider_message_id: reply_params[:reply_to_provider_message_id] || params[:reply_to_provider_message_id]
          )

          render json: {
            message: 'Resposta enviada com sucesso.',
            email_message: {
              id: message.id,
              subject: message.subject,
              from_email: message.from_email,
              to_email: message.to_email,
              body_text: message.body_text,
              body_html: message.body_html.presence || message.body_json&.dig('html'),
              direction: message.direction,
              status: message.status,
              delivery_status: message.delivery_status,
              created_at: message.created_at
            }
          }, status: :created
        rescue ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'INVALID_REPLY')
        rescue ::Sales::EmailSync::ZohoApiClient::AuthError => e
          render_error_response(message: e.message, status: :unauthorized, code: 'ZOHO_AUTH_EXPIRED')
        rescue ::Sales::EmailSync::ZohoApiClient::ApiError => e
          render_error_response(message: "Erro no provedor Zoho Mail: #{e.message}", status: :bad_gateway, code: 'ZOHO_PROVIDER_ERROR')
        rescue StandardError => e
          Rails.logger.error("[InboxRepliesController] Error: #{e.class} - #{e.message}")
          render_error_response(message: "Falha ao enviar resposta: #{e.message}", status: :internal_server_error, code: 'REPLY_FAILED')
        end

        private

        def set_thread
          @thread = ::Sales::EmailThread.where(company_id: current_user.company_id).find(params[:email_thread_id])
          if @thread.email_account && @thread.email_account.user_id != current_user.id && !current_user.admin?
            render_error_response(message: 'Sem permissão para responder por esta conversa.', status: :forbidden, code: 'FORBIDDEN')
          end
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Conversa não encontrada.', status: :not_found, code: 'THREAD_NOT_FOUND')
        end
      end
    end
  end
end
