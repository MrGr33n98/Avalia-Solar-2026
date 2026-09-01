module Api
  module V1
    module Sales
      class ContactsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          account_id = params[:account_id] || params[:sales_account_id]
          contacts = ::Sales::Contact.where(sales_account_id: account_id).order(:first_name)
          render json: { contacts: contacts.as_json(only: %i[id sales_account_id first_name last_name email phone whatsapp job_title decision_role is_primary]) }
        end

        def create
          contact = ::Sales::Contact.new(contact_params)
          contact.sales_account_id ||= params[:account_id] || params[:sales_account_id]
          contact.save!
          render json: { contact: contact }, status: :created
        end

        private

        def require_internal_sales
          return if current_user&.admin?
          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def contact_params
          params.require(:contact).permit(:first_name, :last_name, :email, :phone, :whatsapp, :job_title, :linkedin_url,
                                          :decision_role, :is_primary)
        end
      end
    end
  end
end
