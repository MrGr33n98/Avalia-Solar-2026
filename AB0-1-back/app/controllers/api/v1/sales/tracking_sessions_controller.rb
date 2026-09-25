module Api
  module V1
    module Sales
      class TrackingSessionsController < BaseController
        MAX_PAYLOAD_BYTES = 16.kilobytes

        def create
          return render_oversized_payload if request.raw_post.bytesize > MAX_PAYLOAD_BYTES

          attributes = session_params
          account = scoped_accounts.find_by(id: attributes.delete(:account_id))
          contact = scoped_contacts.find_by(id: attributes.delete(:contact_id))
          return render_hidden_resource if params.dig(:session, :account_id).present? && account.nil?
          return render_hidden_resource if params.dig(:session, :contact_id).present? && contact.nil?

          account ||= contact&.account
          return render_relation_conflict(resource: 'TrackingSession') unless account &&
            current_tenant_scope.valid_relation?(account: account, contact: contact)

          session = ::Sales::TrackingSession.create!(attributes.merge(
            session_id: SecureRandom.uuid,
            account_id: account.id,
            contact_id: contact&.id,
            started_at: Time.current
          ))
          render json: { session_id: session.session_id }, status: :created
        end

        def update
          return render_oversized_payload if request.raw_post.bytesize > MAX_PAYLOAD_BYTES

          session = scoped_sessions.find_by!(session_id: params[:id])
          session.update!(session_params.except(:account_id, :contact_id, :session_id))
          render json: { session_id: session.session_id }
        end

        private

        def session_params
          params.require(:session).permit(:anonymous_id, :account_id, :contact_id, :utm_source, :utm_medium,
                                          :utm_campaign, :ended_at)
        end

        def scoped_accounts
          current_tenant_scope.accounts
        end

        def scoped_contacts
          current_tenant_scope.contacts
        end

        def scoped_sessions
          ::Sales::TrackingSession.where(account_id: scoped_accounts.select(:id))
        end

        def render_hidden_resource
          render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
        end

        def render_oversized_payload
          render_error_response(message: 'Payload de tracking excede o limite.', status: :unprocessable_entity,
                                code: 'TRACKING_PAYLOAD_TOO_LARGE')
        end
      end
    end
  end
end
