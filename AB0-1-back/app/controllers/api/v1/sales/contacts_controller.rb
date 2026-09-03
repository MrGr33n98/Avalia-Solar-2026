module Api
  module V1
    module Sales
      class ContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          scope = ::Sales::Contact.includes(:account, :contact_employments).order(created_at: :desc)

          account_id = params[:account_id] || params[:sales_account_id]
          scope = scope.where(sales_account_id: account_id) if account_id.present?
          scope = scope.where(decision_role: params[:decision_role]) if params[:decision_role].present?

          if params[:q].present?
            q = "%#{params[:q].to_s.downcase}%"
            scope = scope.where(
              'LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(job_title) LIKE ?',
              q, q, q, q
            )
          end

          total_count = scope.count
          page = [params[:page].to_i, 1].max
          per_page = params[:per_page].present? ? [params[:per_page].to_i, 100].min : 50

          contacts = scope.offset((page - 1) * per_page).limit(per_page)

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
          contact = ::Sales::Contact.includes(:account, :contact_employments, :opportunity_contacts, :activities, :tasks).find(params[:id])
          render json: { contact: serialize_detailed(contact) }
        end

        def timeline
          contact = ::Sales::Contact.find(params[:id])
          events = []

          contact.activities.order(occurred_at: :desc).each do |act|
            events << {
              id: "act-#{act.id}",
              type: act.activity_type == 'call' ? 'call' : 'activity',
              title: act.activity_type == 'call' ? 'Chamada Registrada' : 'Atividade Comercial',
              description: act.description || act.body,
              occurred_at: act.occurred_at || act.created_at
            }
          end

          contact.tasks.each do |t|
            events << {
              id: "task-#{t.id}",
              type: 'task',
              title: "Tarefa: #{t.title}",
              description: "Status: #{t.status || 'Pendente'}",
              occurred_at: t.created_at
            }
          end

          contact.opportunity_contacts.includes(:opportunity).each do |oc|
            if oc.opportunity
              events << {
                id: "opp-#{oc.id}",
                type: 'stage_changed',
                title: "Vínculo a Oportunidade #{oc.opportunity.name}",
                description: "Papel no Comitê: #{oc.role || 'Membro'}",
                occurred_at: oc.created_at
              }
            end
          end

          events << {
            id: "contact-created-#{contact.id}",
            type: 'website',
            title: 'Contato Cadastrado no CRM',
            description: "Contato #{contact.first_name} #{contact.last_name} registrado.",
            occurred_at: contact.created_at
          }

          events.sort_by! { |e| e[:occurred_at] || Time.current }.reverse!
          render json: { timeline: events }
        end

        def create
          account_id = params[:account_id] || params[:sales_account_id] || contact_params[:sales_account_id]
          contact = if contact_params[:email].present? && account_id.present?
                      ::Sales::Contact.where(sales_account_id: account_id).find_or_initialize_by(email: contact_params[:email].downcase.strip)
                    else
                      ::Sales::Contact.new
                    end
          contact.assign_attributes(contact_params)
          contact.sales_account_id ||= account_id
          contact.save!
          render json: { contact: serialize_detailed(contact) }, status: contact.previously_new_record? ? :created : :ok
        end

        def update
          contact = ::Sales::Contact.find(params[:id])
          contact.update!(contact_params)
          render json: { contact: serialize_detailed(contact) }
        end

        private

        def contact_params
          params.require(:contact).permit(
            :first_name, :last_name, :email, :phone, :whatsapp, :job_title, :linkedin_url,
            :decision_role, :is_primary, :sales_account_id
          )
        end

        def serialize(contact)
          {
            id: contact.id,
            sales_account_id: contact.sales_account_id,
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
            last_contact_at: contact.updated_at
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
      end
    end
  end
end
