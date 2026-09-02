# frozen_string_literal: true

module Api
  module V1
    module Sales
      class AccountLinksController < BaseController
        def create
          company = ::Company.find(params[:company_id])
          account = ::Sales::Accounts::CreateFromCompany.call(company: company, owner: current_user)
          render json: { account: { id: account.id, name: account.name, company_id: account.company_id, owner_id: account.owner_id } }, status: :created
        end
      end
    end
  end
end
