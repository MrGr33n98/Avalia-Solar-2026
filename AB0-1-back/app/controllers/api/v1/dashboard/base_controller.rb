module Api
  module V1
    module Dashboard
    class BaseController < ActionController::API
      include Paginatable

      before_action :authenticate_user!
      before_action :ensure_approved_user
      before_action :ensure_company

      private

      def authenticate_user!
        render json: { error: 'unauthorized' }, status: :unauthorized unless current_user
      end

      def current_user
        @current_user ||= begin
          header = request.headers['Authorization']
          token = header&.split&.last
          if token.blank?
            nil
          else
            payload = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first
            User.find_by(id: payload['user_id'])
          end
        rescue JWT::DecodeError
          nil
        end
      end

      def ensure_approved_user
        return if current_user&.approved_for_dashboard?

        render json: { error: 'user_not_approved' }, status: :forbidden
      end

      def ensure_company
        return if current_company.present?

        render json: { error: 'company_not_found' }, status: :not_found
      end

      def current_company
        current_user&.company
      end

      def authorize_feature!(feature_name)
        return true if current_company&.feature_enabled?(feature_name)

        render json: { error: 'plan_upgrade_required', feature: feature_name }, status: :forbidden
        false
      end
    end
  end
end
