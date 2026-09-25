module Api
  module V1
    module Sales
      class TrackingIdentityController < BaseController
        def create
          contact = current_tenant_scope.contacts.find(params.require(:contact_id))
          session = tracking_sessions.find_by!(session_id: params.require(:session_id))
          if session.account_id.present?
            account = current_tenant_scope.accounts.find_by(id: session.account_id)
            unless account
              log_sales_denial(reason: 'tracking_session_out_of_scope', resource: 'TrackingSession')
              return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
            end
            return render_relation_conflict(resource: 'TrackingSession') unless current_tenant_scope.valid_relation?(account: account, contact: contact)
          end
          session = ::Sales::TrackingIdentityMerger.call(session: session, contact: contact)
          render json: { session_id: session.session_id, contact_id: session.contact_id, account_id: session.account_id }
        end

        private

        def tracking_sessions
          legacy = ::Sales::TrackingSession.where(account_id: current_tenant_scope.accounts.select(:id))
          return legacy if current_user.company_id.blank?

          legacy.or(::Sales::TrackingSession.where(company_id: current_user.company_id))
        end
      end
    end
  end
end
