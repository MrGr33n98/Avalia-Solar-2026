module Api
  module V1
    module Sales
      class TrackingIdentityController < BaseController
        def create
          contact = ::Sales::Contact.find(params.require(:contact_id))
          session = ::Sales::TrackingIdentityMerger.call(session_id: params.require(:session_id), contact: contact)
          render json: { session_id: session.session_id, contact_id: session.contact_id, account_id: session.account_id }
        end
      end
    end
  end
end
