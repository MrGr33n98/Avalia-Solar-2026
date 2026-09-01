module Api
  module V1
    module Sales
      class AccountLinksController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def create
          company = ::Company.find(params[:company_id])
          account = ::Sales::Accounts::CreateFromCompany.call(company:, owner: current_user)
          render json: { account: { id: account.id, name: account.name, company_id: account.company_id, owner_id: account.owner_id } }, status: :created
        end

        private

        def require_internal_sales
          return if current_user&.admin?
          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end
      end
    end
  end
end
