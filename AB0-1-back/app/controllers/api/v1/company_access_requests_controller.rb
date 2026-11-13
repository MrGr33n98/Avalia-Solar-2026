module Api
  module V1
    class CompanyAccessRequestsController < BaseController
      before_action :authenticate_api_user
      before_action :set_request, only: %i[destroy]

      def create
        # Permite que usuários review também solicitem acesso, mas a role final será 'company' após aprovação?
        # Na verdade, se um review quer gerenciar uma empresa, ele deve mudar para 'company' ou o sistema deve permitir.
        # Conforme solicitado, usuários review podem solicitar administração.
        # Mas o controller exige :require_company_user. Vamos remover ou ajustar.
        unless current_user.role.in?(%w[company review])
          return render_error_response(message: 'Não autorizado', status: :forbidden, code: 'FORBIDDEN')
        end

        # Accept both the canonical JSON contract and the legacy claim form.
        attributes = params[:company_access_request]
        company_id = params[:company_id].presence || attributes&.[](:company_id)
        message = params[:message].presence || attributes&.[](:message)
        contact_email = params[:contact_email].presence || attributes&.[](:contact_email)
        contact_phone = params[:contact_phone].presence || attributes&.[](:contact_phone)
        documents = Array(attributes&.[](:documents)).compact

        # Validate evidence before attaching to avoid storing unchecked files.
        if documents.size > 5 || documents.any? { |doc|
          !doc.respond_to?(:size) || doc.size > 5.megabytes ||
            !%w[application/pdf image/jpeg image/png].include?(doc.content_type)
        }
          return render_error_response(
            message: 'Envie no máximo 5 documentos PDF, JPG ou PNG de até 5 MB cada.',
            status: :unprocessable_entity,
            code: 'INVALID_CLAIM_DOCUMENTS'
          )
        end

        company = ::Company.find_by(id: company_id)
        unless company
          return render_error_response(message: 'Empresa não encontrada', status: :not_found, code: 'COMPANY_NOT_FOUND')
        end

        if company.blocked_status? || company.pending_status? || company.inactive_status?
          return render_error_response(
            message: 'Empresa indisponível para solicitação de acesso',
            status: :unprocessable_entity,
            code: 'COMPANY_NOT_AVAILABLE'
          )
        end

        if company.respond_to?(:moderation_status) && !company.moderation_approved?
          return render_error_response(
            message: 'Empresa ainda nÃ£o aprovada',
            status: :unprocessable_entity,
            code: 'COMPANY_NOT_AVAILABLE'
          )
        end

        if current_user.active_membership_for?(company.id)
          return render_error_response(
            message: 'UsuÃ¡rio jÃ¡ possui acesso Ã  empresa',
            status: :conflict,
            code: 'MEMBERSHIP_EXISTS'
          )
        end

        existing = current_user.company_access_requests.where(company_id: company.id,
                                                              status: %w[
                                                                pending approved
                                                              ]).first
        if existing
          return render_error_response(
            message: 'SolicitaÃ§Ã£o jÃ¡ existe para esta empresa',
            status: :conflict,
            code: 'REQUEST_ALREADY_EXISTS'
          )
        end

        request = current_user.company_access_requests.new(
          company: company,
          message: message,
          contact_email: contact_email,
          contact_phone: contact_phone,
          documents: documents
        )

        if request.save
          render json: {
            request: {
              id: request.id,
              company_id: request.company_id,
              status: request.status,
              requested_at: request.requested_at&.iso8601
            }
          }, status: :created
        else
          render_error_response(
            message: 'Erro ao criar solicitaÃ§Ã£o',
            status: :unprocessable_entity,
            code: 'VALIDATION_ERROR',
            details: request.errors.full_messages
          )
        end
      end

      def destroy
        unless @request.user_id == current_user.id
          return render_error_response(
            message: 'SolicitaÃ§Ã£o nÃ£o pertence ao usuÃ¡rio',
            status: :forbidden,
            code: 'FORBIDDEN'
          )
        end

        cancelled = @request.with_lock do
          next false unless @request.pending?

          @request.update!(
            status: 'rejected',
            admin_note: 'Cancelado pelo usuário',
            reviewed_at: Time.current
          )
          true
        end

        unless cancelled
          return render_error_response(
            message: 'Apenas solicitaÃ§Ãµes pendentes podem ser canceladas',
            status: :conflict,
            code: 'REQUEST_NOT_PENDING'
          )
        end

        head :no_content
      rescue ActiveRecord::RecordInvalid
        render_error_response(
          message: 'Erro ao cancelar solicitaÃ§Ã£o',
          status: :unprocessable_entity,
          code: 'VALIDATION_ERROR',
          details: @request.errors.full_messages
        )
      end

      private

      def set_request
        @request = CompanyAccessRequest.find(params[:id])
      end
    end
  end
end
