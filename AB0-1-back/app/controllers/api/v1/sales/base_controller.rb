# frozen_string_literal: true

module Api
  module V1
    module Sales
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        private

        def require_sales_surface_access!
          return if ::Sales::AuthorizationService.sales_access?(user: current_user)

          render_error_response(
            message: 'CRM interno requer autorização de vendas.',
            status: :forbidden,
            code: 'SALES_FORBIDDEN'
          )
        end
        alias_method :require_internal_sales, :require_sales_surface_access!

        def require_sales_permission!(resource, action)
          return if ::Sales::AuthorizationService.can?(user: current_user, resource: resource, action: action)

          render_error_response(
            message: "Ação não permitida para o recurso #{resource}.",
            status: :forbidden,
            code: 'SALES_FORBIDDEN'
          )
        end
      end
    end
  end
end
