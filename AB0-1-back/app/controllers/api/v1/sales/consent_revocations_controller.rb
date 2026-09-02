# frozen_string_literal: true

module Api
  module V1
    module Sales
      class ConsentRevocationsController < BaseController
        def update
          consent = ::Sales::Consent.find(params[:consent_id])
          ::Sales::RevokeConsent.call(consent: consent, actor: current_user)
          render json: { consent: { id: consent.id, granted: consent.granted, revoked_at: consent.revoked_at } }
        end
      end
    end
  end
end
