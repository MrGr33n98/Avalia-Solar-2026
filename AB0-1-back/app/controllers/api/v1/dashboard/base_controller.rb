module Api
  module V1
    module Dashboard
      class BaseController < Api::V1::BaseController
        include Paginatable

        # Skip the parent's authentication if we are redefining it here, 
        # but actually Api::V1::BaseController doesn't have before_action :authenticate_api_user
        # it just defines the method.

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

        def current_user
          @current_user ||= begin
            header = request.headers['Authorization']
            token = header&.split&.last
            if token.blank?
              nil
            else
              payload = jwt_decode(token)
              User.find_by(id: payload['user_id']) if payload
            end
          rescue StandardError
            nil
          end
        end

        def jwt_decode(token)
          JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first.with_indifferent_access
        rescue JWT::DecodeError
          nil
        end

        def ensure_approved_user
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
