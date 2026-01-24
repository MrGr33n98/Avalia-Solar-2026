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
            if current_user&.respond_to?(:admin?) && current_user.admin? && params[:company_id].present?
              ::Company.find(params[:company_id])
            else
              current_user&.company
            end

          render json: { error: 'Company not found' }, status: :not_found unless @company
        end

        def forbidden
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      end
    end
  end
end
