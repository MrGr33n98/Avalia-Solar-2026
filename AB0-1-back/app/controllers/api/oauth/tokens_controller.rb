# frozen_string_literal: true

module Api
  module Oauth
    class TokensController < Doorkeeper::TokensController
      before_action :validate_mcp_resource!, only: :create
      before_action :validate_mcp_canary_request!, only: :create

      private

      def validate_mcp_resource!
        configuration = ::Mcp::Oauth::Configuration
        return unless configuration.resource_binding_required?
        return if configuration.valid_registered_resource_request?(params[:resource])

        render json: {
          error: 'invalid_target',
          error_description: 'O recurso OAuth solicitado não é um recurso MCP registrado.'
        }, status: :bad_request
      end

      def validate_mcp_canary_request!
        return unless ::Mcp::Canary::Configuration.enabled?
        return render_canary_error unless params[:resource] == ::Mcp::Canary::Configuration::CANONICAL_RESOURCE
        return render_canary_error unless params[:grant_type] == 'authorization_code'
        return render_canary_error if params[:code_verifier].blank?

        grant = Doorkeeper::AccessGrant.by_token(params[:code].to_s)
        return render_canary_error unless grant

        subject = ::Mcp::Oauth::Configuration.subject_for(grant.resource_owner_id)
        allowed = ::Mcp::Canary::Guard.oauth_request_allowed?(
          client_id: params[:client_id].to_s, subject: subject,
          code_challenge_method: grant.code_challenge_method
        )
        render_canary_error unless allowed
      rescue ActiveRecord::RecordNotFound
        render_canary_error
      end

      def render_canary_error
        render json: { error: 'access_denied', error_description: 'OAuth canary authorization denied.' },
               status: :forbidden
      end
    end
  end
end
