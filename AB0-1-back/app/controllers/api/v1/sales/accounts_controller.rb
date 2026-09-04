module Api
  module V1
    module Sales
      class AccountsController < BaseController
        def index
          if params[:options].present? || params[:limit].present?
            limit = [(params[:limit] || 20).to_i, 50].min
            accounts = scoped_accounts.merge(::Sales::AccountOptionsQuery.call(query: params[:q], limit: limit))
            render json: { accounts: accounts.map { |a| { id: a.id, name: a.name, domain: a.domain } } }
            return
          end

          tenant_key = current_user.company_id || current_user.id
          version = Rails.cache.read("crm:v2:tenant:#{tenant_key}:accounts_ver") || 1
          query_hash = Digest::SHA256.hexdigest(params.to_unsafe_h.except(:controller, :action).sort.to_s)
          cache_key = "crm:v2:tenant:#{tenant_key}:accounts:v#{version}:#{query_hash}"

          response_data = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
            query_result = ::Sales::AccountsQuery.call(scoped_accounts, params)
                                                 .paginate_result(page: params[:page], per_page: params[:per_page])

            records = query_result[:records].includes(:company, :owner, :contacts, :opportunities, :tags)
            serialized = serialize_batch(records)

            {
              accounts: serialized,
              meta: query_result[:meta]
            }
          end

          render json: response_data
        end

        def export
          csv_data = ::Sales::AccountExportService.call(scoped_accounts, params)
          filename = "companies_export_#{Time.current.strftime('%Y%m%d_%H%M%S')}.csv"
          send_data csv_data, type: 'text/csv; charset=utf-8', filename: filename
        end

        def filter_options
          options = ::Sales::AccountFilterOptionsQuery.call(scoped_accounts)
          render json: { options: options }
        end

        def bulk
          result = ::Sales::Accounts::BulkActionService.call(
            tenant_scope: scoped_accounts,
            account_ids: params[:account_ids] || params[:ids],
            action_type: params[:action_type],
            payload: params[:payload] || params,
            current_user: current_user
          )
          render json: result
        rescue ArgumentError => e
          render json: { error: { message: e.message } }, status: :bad_request
        rescue StandardError => e
          render json: { error: { message: e.message } }, status: :unprocessable_entity
        end

        def duplicates
          result = ::Sales::AccountDuplicateDetector.call(scoped_accounts)
          render json: result
        end

        def merge
          result = ::Sales::AccountMergeService.call(
            tenant_scope: scoped_accounts,
            master_account_id: params[:master_account_id],
            duplicate_account_id: params[:duplicate_account_id],
            current_user: current_user
          )
          render json: result
        rescue ArgumentError => e
          render json: { error: { message: e.message } }, status: :bad_request
        rescue StandardError => e
          render json: { error: { message: e.message } }, status: :unprocessable_entity
        end

        def create
          ActiveRecord::Base.transaction do
            account = ::Sales::Account.where(owner: current_user).find_or_initialize_by(name: account_params[:name])
            account.assign_attributes(
              account_params.merge(
                owner: current_user,
                company_id: account_params[:company_id]
              )
            )
            account.save!

            if params[:primary_contact].present?
              c_params = params[:primary_contact]
              first_name = c_params[:first_name].presence || c_params[:name] || 'Contato'
              last_name = c_params[:last_name]
              contact_email = c_params[:email].presence

              contact = if c_params[:id].present?
                          account.contacts.find_by(id: c_params[:id]) || account.contacts.build
                        elsif contact_email.present?
                          account.contacts.find_or_initialize_by(email: contact_email)
                        else
                          account.contacts.build
                        end

              contact.assign_attributes(
                first_name: first_name,
                last_name: last_name,
                email: contact_email,
                job_title: c_params[:job_title],
                phone: c_params[:phone] || account.phone,
                is_primary: true,
                user: current_user
              )
              contact.sales_account_id ||= account.id
              contact.save!
            end

            begin
              DomainEvent.create!(
                event_type: 'sales.account.created',
                aggregate_type: account.class.name,
                aggregate_id: account.id,
                occurred_at: Time.current,
                status: 'pending',
                payload: { account_id: account.id, actor_id: current_user.id }
              )
            rescue => e
              Rails.logger.warn("[DomainEvent] Failed to emit sales.account.created event: #{e.message}")
            end

            render json: { account: serialize_detailed(account) }, status: account.previously_new_record? ? :created : :ok
          end
        rescue ActionController::ParameterMissing => e
          render json: { error: { message: "Parâmetro obrigatório ausente: #{e.param}" } }, status: :bad_request
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: { message: e.message } }, status: :unprocessable_entity
        rescue StandardError => e
          Rails.logger.error("[AccountsController#create Exception] #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
          render json: { error: { message: e.message || 'Erro interno ao criar empresa' } }, status: :internal_server_error
        end

        def show
          account = scoped_accounts.includes(:company, :owner, :contacts, :opportunities, :activities, :tasks, :solar_projects, :tags).find(params[:id])
          render json: { account: serialize_detailed(account) }
        end

        def update
          account = scoped_accounts.find(params[:id])
          account.update!(account_params)
          render json: { account: serialize_detailed(account) }
        end

        def timeline
          account = scoped_accounts.find(params[:id])
          events = ::Sales::TimelineBuilder.for_account(account)
          render json: { timeline: events }
        end

        private

        def scoped_accounts
          return ::Sales::Account.all if current_user.admin?
          if current_user.company_id.present?
            user_ids = User.where(company_id: current_user.company_id).pluck(:id)
            ::Sales::Account.where(owner_id: user_ids).or(::Sales::Account.where(company_id: current_user.company_id))
          else
            ::Sales::Account.where(owner_id: current_user.id)
          end
        end

        def account_params
          params.require(:account).permit(:name, :company_id, :domain, :website, :phone, :email, :city, :state,
                                          :segment, :company_size, :source, :source_detail, :status)
        end

        def serialize_batch(accounts)
          account_ids = accounts.map(&:id)
          return [] if account_ids.empty?

          last_activity_times = ::Sales::Activity.where(sales_account_id: account_ids)
                                                  .group(:sales_account_id)
                                                  .maximum(:occurred_at)

          accounts.map do |account|
            contacts = account.contacts.to_a
            primary = contacts.find(&:is_primary?) || contacts.first
            open_opps = account.opportunities.to_a.reject { |o| %w[won lost].include?(o.status.to_s.downcase) }
            last_activity = last_activity_times[account.id] || account.created_at

            {
              id: account.id,
              name: account.name,
              company_id: account.company_id,
              owner_id: account.owner_id,
              owner_name: account.owner&.name || 'Vendedor Interno',
              status: account.status || 'prospect',
              company_type: account.segment || account.company_size || 'Standard Account',
              tags: account.tags.map { |tag| { id: tag.id, name: tag.name, color: tag.color } },
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
              people_count: contacts.size,
              open_opportunities_count: open_opps.size,
              open_pipeline_value_cents: open_opps.sum(&:value_cents),
              last_activity_at: last_activity
            }
          end
        end

        def serialize(account)
          serialize_batch([account]).first
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
