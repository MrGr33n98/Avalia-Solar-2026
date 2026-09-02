module Api
  module V1
    module Sales
      class ContactEmploymentsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          contact = ::Sales::Contact.find(params[:contact_id])
          employments = contact.contact_employments.includes(:account)
          render json: { employments: employments.map { |e| serialize(e) } }
        end

        def create
          contact = ::Sales::Contact.find(params[:contact_id])
          employment = contact.contact_employments.new(employment_params)
          employment.save!
          render json: { employment: serialize(employment) }, status: :created
        end

        def update
          employment = ::Sales::ContactEmployment.find(params[:id])
          employment.update!(employment_params)
          render json: { employment: serialize(employment) }
        end

        def destroy
          employment = ::Sales::ContactEmployment.find(params[:id])
          employment.update!(is_current: false, ended_at: Time.current)
          render json: { message: 'Vínculo encerrado com sucesso.' }
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def employment_params
          params.require(:employment).permit(
            :sales_account_id, :job_title, :department, :seniority,
            :relationship_type, :is_current, :is_primary, :started_at, :ended_at
          )
        end

        def serialize(e)
          {
            id: e.id,
            sales_contact_id: e.sales_contact_id,
            sales_account_id: e.sales_account_id,
            account_name: e.account&.name,
            job_title: e.job_title,
            department: e.department,
            seniority: e.seniority,
            relationship_type: e.relationship_type,
            is_current: e.is_current,
            is_primary: e.is_primary
          }
        end
      end
    end
  end
end
