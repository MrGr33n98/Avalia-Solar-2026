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

          if params[:q].present?
            q = "%#{params[:q].to_s.downcase}%"
            scope = scope.where(
              'LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(job_title) LIKE ?',
              q, q, q, q
            )
          end

          render json: { contacts: scope.limit(100).map { |c| serialize(c) } }
        end

        def show
          contact = ::Sales::Contact.includes(:account, :contact_employments, :opportunity_contacts, :activities, :tasks).find(params[:id])
          render json: { contact: serialize_detailed(contact) }
        end

        def create
          contact = ::Sales::Contact.new(contact_params)
          contact.sales_account_id ||= params[:account_id] || params[:sales_account_id]
          contact.save!
          render json: { contact: serialize_detailed(contact) }, status: :created
        end

        def update
          contact = ::Sales::Contact.find(params[:id])
          contact.update!(contact_params)
          render json: { contact: serialize_detailed(contact) }
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

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
            decision_role: contact.decision_role,
            is_primary: contact.is_primary,
            account_name: contact.account&.name
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
