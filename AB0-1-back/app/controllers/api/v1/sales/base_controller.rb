# frozen_string_literal: true

module Api
  module V1
    module Sales
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        private

        def require_internal_sales
          return if current_user.present?

          render_error_response(
            message: 'CRM interno requer autorização de vendas.',
            status: :forbidden,
            code: 'SALES_FORBIDDEN'
          )
        end
      end
    end
  end
end
