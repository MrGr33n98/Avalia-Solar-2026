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

        def show
          account = ::Sales::Account.includes(:company, :owner, :contacts, :opportunities, :activities, :tasks).find(params[:id])
          render json: { account: serialize_detailed(account) }
        end

        def update
          account = ::Sales::Account.find(params[:id])
          account.update!(account_params)
          render json: { account: serialize_detailed(account) }
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def account_params
          params.require(:account).permit(:name, :company_id, :domain, :website, :phone, :email, :city, :state,
                                          :segment, :company_size, :source, :source_detail, :status)
        end

        def serialize(account)
          { id: account.id, name: account.name, company_id: account.company_id, owner_id: account.owner_id,
            status: account.status, domain: account.domain, city: account.city, state: account.state }
        end

        def serialize_detailed(account)
          company = account.company
          {
            id: account.id,
            name: account.name,
            company_id: account.company_id,
            owner_id: account.owner_id,
            owner_name: account.owner&.name || 'Vendedor Interno',
            status: account.status || 'prospect',
            domain: account.domain,
            website: account.website,
            phone: account.phone,
            email: account.email,
            city: account.city,
            state: account.state,
            segment: account.segment || 'Integrador / Instalador',
            company_size: account.company_size,
            source: account.source,
            created_at: account.created_at,
            updated_at: account.updated_at,
            contacts: account.contacts.map do |c|
              { id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone,
                whatsapp: c.whatsapp, job_title: c.job_title, decision_role: c.decision_role, is_primary: c.is_primary }
            end,
            opportunities: account.opportunities.map do |o|
              { id: o.id, name: o.name, stage_id: o.sales_stage_id, value_cents: o.value_cents, probability: o.probability }
            end,
            activities: account.activities.order(occurred_at: :desc).limit(20).map do |a|
              { id: a.id, activity_type: a.activity_type, subject: a.subject, body: a.body, occurred_at: a.occurred_at }
            end,
            tasks: account.tasks.map do |t|
              { id: t.id, title: t.title, due_at: t.due_at, completed_at: t.completed_at, priority: t.priority }
            end,
            fit_score: ::Sales::FitScoreCalculator.calculate(account),
            data_quality: ::Sales::DataQualityCalculator.calculate(account),
            next_best_action: ::Sales::NextBestActionResolver.resolve(account),
            marketplace: company ? {
              id: company.id,
              name: company.name,
              slug: company.slug,
              rating_avg: company.try(:rating_avg).to_f,
              rating_count: company.try(:rating_count).to_i,
              verified: company.try(:verified) || false,
              city: company.city,
              state: company.state,
            } : nil
          }
        end
      end
    end
  end
end
