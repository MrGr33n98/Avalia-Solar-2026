module Api
  module V1
    module Sales
      class ActivitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        def index
          account_id = params[:account_id] || params[:sales_account_id]
          account = current_tenant_scope.accounts.find_by(id: account_id)
          return render json: { error: 'Invalid account or inaccessible' }, status: :not_found unless account

          activities = current_tenant_scope.activities.where(sales_account_id: account.id).order(occurred_at: :desc).limit(100)
          render json: { activities: activities }
        end

        def create
          attrs = activity_params.to_h.symbolize_keys
          if params[:account_id].present? && attrs[:sales_account_id].present? &&
             attrs[:sales_account_id].to_s != params[:account_id].to_s
            return render_relation_conflict(resource: 'Activity')
          end
          acc_id = params[:account_id] || params[:sales_account_id] || attrs[:sales_account_id]
          opp_id = attrs[:sales_opportunity_id]
          cnt_id = attrs[:sales_contact_id]

          account = current_tenant_scope.accounts.find_by(id: acc_id) if acc_id.present?
          opportunity = current_tenant_scope.opportunities.find_by(id: opp_id) if opp_id.present?
          contact = current_tenant_scope.contacts.find_by(id: cnt_id) if cnt_id.present?

          account ||= opportunity&.account
          account ||= contact&.account

          unless account
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          if opp_id.present? && opportunity.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Opportunity')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          if cnt_id.present? && contact.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          unless current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
            return render_relation_conflict(resource: 'Activity')
          end

          activity = ::Sales::Activity.new(attrs.merge(sales_account_id: account.id, actor: current_user, occurred_at: Time.current))
          activity.save!
          render json: { activity: activity }, status: :created
        end
        private

        def activity_params
          params.require(:activity).permit(:sales_account_id, :sales_opportunity_id, :sales_contact_id, :activity_type, :direction, :subject, :body)
        end
      end
    end
  end
end
