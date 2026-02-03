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

        company = Company.find_by(id: params[:company_id])
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

        existing = current_user.company_access_requests.where(company_id: company.id, status: %w[pending approved]).first
        if existing
          return render_error_response(
            message: 'SolicitaÃ§Ã£o jÃ¡ existe para esta empresa',
            status: :conflict,
            code: 'REQUEST_ALREADY_EXISTS'
          )
        end

        request = current_user.company_access_requests.new(
          company: company,
          message: params[:message]
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

        unless @request.pending?
          return render_error_response(
            message: 'Apenas solicitaÃ§Ãµes pendentes podem ser canceladas',
            status: :conflict,
            code: 'REQUEST_NOT_PENDING'
          )
        end

        @request.update!(
          status: 'rejected',
          admin_note: 'Cancelado pelo usuÃ¡rio',
          reviewed_at: Time.current
        )

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
