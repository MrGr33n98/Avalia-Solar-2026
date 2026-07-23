module Api
  module V1
    module CompanyAdmin
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :set_company

        rescue_from Pundit::NotAuthorizedError, with: :forbidden

        private

        def set_company
          @company =
            if current_user.respond_to?(:admin?) && current_user.admin? && params[:company_id].present?
              ::Company.find(params[:company_id])
            elsif params[:company_id].present? && current_user&.respond_to?(:active_membership_for?) && current_user.active_membership_for?(params[:company_id])
              ::Company.find(params[:company_id])
            else
              current_user&.active_member_companies&.first || current_user&.company
            end

          render json: { error: 'Company not found' }, status: :not_found unless @company
        end

        def forbidden
          render json: { error: 'Forbidden' }, status: :forbidden
        end

        def require_company_feature!(feature)
          return if current_user&.admin? || @company.feature_enabled?(feature)

          render json: {
            error: 'Feature unavailable for this company',
            feature: feature,
            code: 'FEATURE_NOT_AVAILABLE'
          }, status: :forbidden
        end
      end
    end
  end
end
