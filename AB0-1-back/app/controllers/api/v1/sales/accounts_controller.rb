module Api
  module V1
    module Sales
      class AccountsController < BaseController
        def index
          if params[:options].present? || params[:limit].present?
            limit = [ (params[:limit] || 20).to_i, 50 ].min
            accounts = ::Sales::AccountOptionsQuery.call(query: params[:q], limit: limit)
            render json: { accounts: accounts.map { |a| { id: a.id, name: a.name, domain: a.domain } } }
            return
          end

          scope = ::Sales::Account.includes(:company, :owner, :contacts, :opportunities).order(created_at: :desc)
          if params[:q].present?
            q = "%#{params[:q].to_s.downcase}%"
            scope = scope.where('LOWER(name) LIKE ? OR LOWER(domain) LIKE ?', q, q)
          end
          scope = scope.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          scope = scope.where(status: params[:status]) if params[:status].present?

          render json: { accounts: scope.limit(200).map { |account| serialize(account) } }
        end

        def create
          ActiveRecord::Base.transaction do
            account = ::Sales::Account.where(owner: current_user).find_or_initialize_by(name: account_params[:name])
            account.assign_attributes(account_params.merge(owner: current_user))
            account.save!

            if params[:primary_contact].present?
              contact = account.contacts.find_or_initialize_by(email: params[:primary_contact][:email])
              contact.assign_attributes(
                first_name: params[:primary_contact][:first_name],
                last_name: params[:primary_contact][:last_name],
                job_title: params[:primary_contact][:job_title],
                phone: params[:primary_contact][:phone],
                is_primary: true,
                user: current_user
              )
              contact.save!
            end

            DomainEvent.create!(
              event_type: 'sales.account.created', aggregate_type: account.class.name,
              aggregate_id: account.id, occurred_at: Time.current,
              payload: { account_id: account.id, actor_id: current_user.id }
            )

            render json: { account: serialize_detailed(account) }, status: account.previously_new_record? ? :created : :ok
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: { message: e.message } }, status: :unprocessable_entity
        end

        def show
          account = ::Sales::Account.includes(:company, :owner, :contacts, :opportunities, :activities, :tasks, :solar_projects).find(params[:id])
          render json: { account: serialize_detailed(account) }
        end

        def update
          account = ::Sales::Account.find(params[:id])
          account.update!(account_params)
          render json: { account: serialize_detailed(account) }
        end

        def timeline
          account = ::Sales::Account.find(params[:id])
          events = []

          account.activities.order(occurred_at: :desc).each do |act|
            events << {
              id: "act-#{act.id}",
              type: act.activity_type == 'call' ? 'call' : 'activity',
              title: act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial',
              description: act.description || act.body,
              occurred_at: act.occurred_at || act.created_at
            }
          end

          account.tasks.each do |t|
            events << {
              id: "task-#{t.id}",
              type: 'task',
              title: "Tarefa: #{t.title}",
              description: "Status: #{t.status}",
              occurred_at: t.created_at
            }
          end

          account.opportunities.each do |o|
            events << {
              id: "opp-#{o.id}",
              type: 'stage_changed',
              title: "Oportunidade #{o.name}",
              description: "Estágio: #{o.stage&.name || 'Prospect'}",
              occurred_at: o.created_at
            }
          end

          events << {
            id: "acc-created-#{account.id}",
            type: 'website',
            title: 'Empresa Cadastrada no CRM',
            description: "Empresa #{account.name} registrada.",
            occurred_at: account.created_at
          }

          events.sort_by! { |e| e[:occurred_at] || Time.current }.reverse!
          render json: { timeline: events }
        end

        private

        def account_params
          params.require(:account).permit(:name, :company_id, :domain, :website, :phone, :email, :city, :state,
                                          :segment, :company_size, :source, :source_detail, :status)
        end

        def serialize(account)
          primary = account.contacts.find_by(is_primary: true) || account.contacts.first
          open_opps = account.opportunities.select { |o| o.status == 'open' }
          {
            id: account.id,
            name: account.name,
            company_id: account.company_id,
            owner_id: account.owner_id,
            owner_name: account.owner&.name || 'Vendedor Interno',
            status: account.status || 'prospect',
            company_type: account.segment || account.company_size || 'Standard Account',
            domain: account.domain,
            city: account.city,
            state: account.state,
            phone: account.phone,
            email: account.email,
            primary_contact: primary ? {
              id: primary.id,
              first_name: primary.first_name,
              last_name: primary.last_name,
              email: primary.email,
              job_title: primary.job_title
            } : nil,
            people_count: account.contacts.size,
            open_opportunities_count: open_opps.size,
            open_pipeline_value_cents: open_opps.sum(&:value_cents),
            last_activity_at: account.updated_at
          }
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
            solar_project_id: account.solar_projects.order(created_at: :desc).first&.id,
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
