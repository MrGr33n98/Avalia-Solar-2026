module Api
  module V1
    module Sales
      class ContactEmploymentsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          contact = current_tenant_scope.contacts.find(params[:contact_id])
          employments = contact.contact_employments.includes(:account)
          render json: { employments: employments.map { |e| serialize(e) } }
        end

        def create
          contact = current_tenant_scope.contacts.find(params[:contact_id])
          acc_id = employment_params[:sales_account_id] || params[:sales_account_id]
          account = current_tenant_scope.accounts.find_by(id: acc_id)

          unless account
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          unless current_tenant_scope.valid_employment?(contact: contact, account: account)
            return render_relation_conflict(resource: 'ContactEmployment')
          end

          employment = contact.contact_employments.new(employment_params.merge(sales_account_id: account.id))
          employment.save!
          render json: { employment: serialize(employment) }, status: :created
        end

        def update
          contact = current_tenant_scope.contacts.find(params[:contact_id])
          employment = contact.contact_employments.find(params[:id])
          attrs = employment_params.to_h.symbolize_keys
          account_id = attrs[:sales_account_id].presence || employment.sales_account_id
          account = current_tenant_scope.accounts.find_by(id: account_id)
          unless account
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          return render_relation_conflict(resource: 'ContactEmployment') unless current_tenant_scope.valid_employment?(contact: contact, account: account)
          employment.update!(attrs)
          render json: { employment: serialize(employment) }
        end

        def destroy
          contact = current_tenant_scope.contacts.find(params[:contact_id])
          employment = contact.contact_employments.find(params[:id])
          employment.update!(is_current: false, ended_at: Time.current)
          render json: { message: 'Vínculo encerrado com sucesso.' }
        end

        private



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
