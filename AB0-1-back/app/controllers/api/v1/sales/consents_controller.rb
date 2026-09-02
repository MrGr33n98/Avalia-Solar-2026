module Api
  module V1
    module Sales
      class ConsentsController < BaseController
        def index
          consents = ::Sales::Consent.where(contact_id: params[:contact_id]).order(created_at: :desc)
          render json: { consents: consents.map { |consent| serialize(consent) } }
        end

        def create
          consent = ::Sales::Consent.create!(consent_params.merge(granted_at: Time.current))
          render json: { consent: serialize(consent) }, status: :created
        end

        private

        def consent_params
          params.require(:consent).permit(:contact_id, :purpose, :lawful_basis, :granted, :source, :expires_at)
        end

        def serialize(consent)
          { id: consent.id, contact_id: consent.contact_id, purpose: consent.purpose,
            lawful_basis: consent.lawful_basis, granted: consent.granted, granted_at: consent.granted_at,
            revoked_at: consent.revoked_at, expires_at: consent.expires_at, source: consent.source }
        end
      end
    end
  end
end
