module Api
  module V1
    module Dashboard
      class BaseController < Api::V1::BaseController
        include Paginatable

        # Autenticação via Api::V1::BaseController#decoded_token que aceita:
        #   1. Header Authorization: Bearer <token>
        #   2. Cookie signed :jwt_token (mecanismo usado pelo frontend via credentials: 'include')
        # Não sobrescrever current_user aqui para não quebrar o suporte a cookies.
        before_action :authenticate_user!
        before_action :ensure_approved_user
        before_action :ensure_company

        private

        def authenticate_user!
          return if current_user

          render_error_response(
            message: 'Authentication required',
            status: :unauthorized,
            code: 'UNAUTHORIZED'
          )
        end

        def ensure_approved_user
          return if current_user&.review_user?
          return if current_user&.approved_for_dashboard?

          render_error_response(
            message: 'Usuário não aprovado para o dashboard',
            status: :forbidden,
            code: 'USER_NOT_APPROVED'
          )
        end

        def ensure_company
          return if current_user&.review_user?
          return if current_company.present?

          render_error_response(
            message: 'Empresa não encontrada',
            status: :not_found,
            code: 'COMPANY_NOT_FOUND'
          )
        end

        def current_company
          current_user&.company
        end

        def authorize_feature!(feature_name)
          return true if current_company&.feature_enabled?(feature_name)

          render_error_response(
            message: "Upgrade de plano necessário para a funcionalidade: #{feature_name}",
            status: :forbidden,
            code: 'PLAN_UPGRADE_REQUIRED',
            details: { feature: feature_name }
          )
          false
        end
      end
    end
  end
end
