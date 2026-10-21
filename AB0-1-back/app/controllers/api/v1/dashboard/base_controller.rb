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
          return if current_user&.admin?
          return if current_user&.review_user?
          return if current_user&.approved_for_dashboard?

          render_error_response(
            message: 'Usuário não aprovado para o dashboard',
            status: :forbidden,
            code: 'USER_NOT_APPROVED'
          )
        end

        def ensure_company
          return if current_company.present?

          render_error_response(
            message: 'Empresa não encontrada',
            status: :not_found,
            code: 'COMPANY_NOT_FOUND'
          )
        end

        def current_company
          @current_company ||= begin
            param_company_id = params[:company_id] || params.dig(:product, :company_id) || params.dig(:service, :company_id)

            if current_user&.admin?
              if param_company_id.present?
                ::Company.find_by(id: param_company_id)
              else
                current_user.company || current_user.active_member_companies.first
              end
            elsif param_company_id.present? && current_user&.active_membership_for?(param_company_id)
              ::Company.find_by(id: param_company_id)
            else
              selected_company_id = cookies.signed[:active_company_id] || current_user&.company_id
              if selected_company_id.present? && current_user&.active_membership_for?(selected_company_id)
                ::Company.find_by(id: selected_company_id)
              else
                current_user&.company || current_user&.active_member_companies&.first
              end
            end
          end
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
