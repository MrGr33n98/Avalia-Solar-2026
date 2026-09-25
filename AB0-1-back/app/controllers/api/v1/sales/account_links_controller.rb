# frozen_string_literal: true

module Api
  module V1
    module Sales
      class AccountLinksController < BaseController
        def create
          company = ::Company.find(params[:company_id])
          unless current_user.admin? || company.id == current_user.company_id
            log_sales_denial(reason: 'company_out_of_scope', resource: 'Company')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          owner = if company.id == current_user.company_id
                    current_user
                  elsif current_user.admin?
                    User.where(company_id: company.id).order(:id).first
                  end
          return render_relation_conflict(resource: 'Account') unless owner

          account = ::Sales::Accounts::CreateFromCompany.call(company: company, owner: owner)
          return render_relation_conflict(resource: 'Account') unless current_tenant_scope.valid_owner?(account.owner, account: account)
          render json: { account: { id: account.id, name: account.name, company_id: account.company_id, owner_id: account.owner_id } }, status: :created
        end
      end
    end
  end
end
