# frozen_string_literal: true

module Api
  module V1
    module Sales
      class ConsentRevocationsController < BaseController
        def update
          contact_ids = current_tenant_scope.contacts.select(:id)
          consent = ::Sales::Consent.where(contact_id: contact_ids).find(params[:consent_id])
          ::Sales::RevokeConsent.call(consent: consent, actor: current_user)
          render json: { consent: { id: consent.id, granted: consent.granted, revoked_at: consent.revoked_at } }
        end
      end
    end
  end
end
