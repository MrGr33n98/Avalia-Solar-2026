module Api
  module V1
    module Sales
      class ContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          if params[:options].present? || params[:sales_account_id].present? || params[:account_id].present?
            acc_id = params[:sales_account_id] || params[:account_id]
            if acc_id.present?
              account = ::Sales::TenantScope.for(current_user).accounts.find_by(id: acc_id)
              return render json: { error: 'Account not found or access denied' }, status: :not_found unless account
            end

            limit = [ (params[:limit] || 20).to_i, 50 ].min
            contacts = ::Sales::ContactOptionsQuery.call(account_id: acc_id, query: params[:q], limit: limit, scope: scoped_contacts)
            render json: {
              contacts: contacts.map do |c|
                {
                  id: c.id,
                  first_name: c.first_name,
                  last_name: c.last_name,
                  name: [c.first_name, c.last_name].compact.join(' '),
                  email: c.email,
                  job_title: c.job_title
                }
              end
            }
            return
          end

          query_scope = ::Sales::ContactsQuery.new(params, scope: scoped_contacts).call
          total_count = query_scope.count
          page = [params[:page].to_i, 1].max
          per_page = params[:per_page].present? ? [params[:per_page].to_i, 100].min : 50

          contacts = query_scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            contacts: contacts.map { |c| serialize(c) },
            meta: {
              page: page,
              per_page: per_page,
              total: total_count,
              pages: (total_count.to_f / per_page).ceil
            }
          }
        end

        def show
          contact = scoped_contacts.includes(:account, :user, :contact_employments, :opportunity_contacts, :activities, :tasks).find(params[:id])
          render json: { contact: serialize_detailed(contact) }
        end

        def engagement
          contact = scoped_contacts.find(params[:id])
          emails = contact.email_messages
          render json: { engagement: { sent: emails.where.not(sent_at: nil).count, delivered: emails.where(status: "delivered").count, opens: emails.sum(:open_count), clicks: emails.sum(:click_count), last_opened_at: emails.maximum(:last_opened_at), last_clicked_at: emails.maximum(:last_clicked_at) } }
        end

        def timeline
          contact = scoped_contacts.find(params[:id])
          timeline = ::Sales::Contacts::TimelineBuilder.build(contact)
          timeline = timeline.select { |event| event[:type].to_s == params[:type].to_s } if params[:type].present?
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 50).to_i, 1].max, 100].min
          total = timeline.length
          render json: { timeline: timeline.slice((page - 1) * per_page, per_page) || [], meta: { page: page, per_page: per_page, total: total } }
        end

        def create
          account_id = params[:account_id] || params[:sales_account_id] || contact_params[:sales_account_id]
          company_name = params[:company_name] || params[:account_name] || contact_params[:company_name]

          if account_id.present?
            account = ::Sales::TenantScope.for(current_user).accounts.find_by(id: account_id)
            return render json: { error: 'Account not found or access denied' }, status: :not_found unless account
          elsif company_name.present?
            c_name = company_name.to_s.strip
            if c_name.present?
              account = ::Sales::TenantScope.for(current_user).accounts.find_or_create_by!(name: c_name) do |a|
                a.owner = current_user
              end
              account_id = account.id
            end
          end

          contact = if contact_params[:email].present? && account_id.present?
                      scoped_contacts.where(sales_account_id: account_id).find_or_initialize_by(email: contact_params[:email].downcase.strip)
                    else
                      ::Sales::Contact.new
                    end
          attrs = contact_params.except(:company_name)
          attrs[:user_id] = params[:owner_id] if params[:owner_id].present?
          contact.assign_attributes(attrs)
          contact.sales_account_id = account_id if account_id.present?
          contact.user ||= current_user
          contact.save!
          render json: { contact: serialize_detailed(contact) }, status: contact.previously_new_record? ? :created : :ok
        end

        def update
          contact = scoped_contacts.find(params[:id])
          attrs = contact_params.except(:company_name)
          attrs[:user_id] = params[:owner_id] if params[:owner_id].present?
          contact.update!(attrs)
          render json: { contact: serialize_detailed(contact) }
        end

        private

        def contact_params
          params.require(:contact).permit(
            :first_name, :last_name, :email, :phone, :whatsapp, :job_title, :linkedin_url,
            :decision_role, :is_primary, :sales_account_id, :user_id, :owner_id, :company_name
          )
        end

        def serialize(contact)
          last_contact = ::Sales::Contacts::LastContactResolver.resolve(contact)
          next_action = ::Sales::Contacts::NextActionResolver.resolve(contact)

          {
            id: contact.id,
            sales_account_id: contact.sales_account_id,
            owner_id: contact.user_id,
            owner_name: contact.user&.name || 'Vendedor Responsável',
            first_name: contact.first_name,
            last_name: contact.last_name,
            name: [contact.first_name, contact.last_name].compact.join(' '),
            email: contact.email,
            phone: contact.phone,
            whatsapp: contact.whatsapp,
            job_title: contact.job_title,
            linkedin_url: contact.linkedin_url,
            decision_role: contact.decision_role || 'decision_maker',
            is_primary: contact.is_primary,
            account_name: contact.account&.name,
            last_contact_at: last_contact[:last_contact_at],
            last_contact_type: last_contact[:last_contact_type],
            last_contact_title: last_contact[:last_contact_title],
            next_action_at: next_action[:next_action_at],
            next_action_type: next_action[:next_action_type],
            next_action_title: next_action[:next_action_title]
          }
        end

        def serialize_detailed(contact)
          serialize(contact).merge(
            account: contact.account ? { id: contact.account.id, name: contact.account.name, city: contact.account.city, state: contact.account.state } : nil,
            employments: contact.contact_employments.map do |e|
              {
                id: e.id,
                sales_account_id: e.sales_account_id,
                account_name: e.account&.name,
                job_title: e.job_title,
                department: e.department,
                seniority: e.seniority,
                relationship_type: e.relationship_type,
                is_current: e.is_current,
                is_primary: e.is_primary
              }
            end,
            buying_opportunities: contact.opportunity_contacts.includes(:opportunity).map do |oc|
              {
                id: oc.id,
                opportunity_id: oc.sales_opportunity_id,
                opportunity_name: oc.opportunity&.name,
                role: oc.role,
                influence: oc.influence,
                support_level: oc.support_level,
                is_primary: oc.is_primary
              }
            end,
            activities: contact.activities.order(occurred_at: :desc).limit(10).map do |a|
              { id: a.id, activity_type: a.activity_type, subject: a.subject, occurred_at: a.occurred_at }
            end,
            tasks: contact.tasks.map do |t|
              { id: t.id, title: t.title, due_at: t.due_at, completed_at: t.completed_at }
            end
          )
        end
        def scoped_contacts
          ::Sales::TenantScope.for(current_user).contacts
        end
      end
    end
  end
end
