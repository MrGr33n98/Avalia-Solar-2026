module Api
  module V1
    module Sales
      class AccountsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          scope = ::Sales::Account.includes(:company, :owner).order(created_at: :desc)
          scope = scope.where('LOWER(name) LIKE ?', "%#{params[:q].to_s.downcase}%") if params[:q].present?
          render json: { accounts: scope.limit(100).map { |account| serialize(account) } }
        end

        def create
          account = ::Sales::Account.new(account_params.merge(owner: current_user))
          account.save!
          DomainEvent.create!(event_type: 'sales.account.created', aggregate_type: account.class.name,
                              aggregate_id: account.id, occurred_at: Time.current,
                              payload: { account_id: account.id, actor_id: current_user.id })
          render json: { account: serialize(account) }, status: :created
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def account_params
          params.require(:account).permit(:name, :company_id, :domain, :website, :phone, :email, :city, :state,
                                          :segment, :company_size, :source, :source_detail)
        end

        def serialize(account)
          { id: account.id, name: account.name, company_id: account.company_id, owner_id: account.owner_id,
            status: account.status, domain: account.domain, city: account.city, state: account.state }
        end
      end
    end
  end
end
