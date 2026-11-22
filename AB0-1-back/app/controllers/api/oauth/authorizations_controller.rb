# frozen_string_literal: true

module Api
  module Oauth
    class AuthorizationsController < Doorkeeper::AuthorizationsController
      before_action :validate_mcp_resource!, only: %i[new create destroy]
      before_action :validate_mcp_canary_request!, only: %i[new create]

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
        return unless ::Mcp::Canary::Configuration.enforced?
        return head :forbidden unless params[:resource] == ::Mcp::Canary::Configuration.canonical_resource
        return unless respond_to?(:current_user) && current_user.present?

        client_id = params[:client_id].to_s
        subject = ::Mcp::Oauth::Configuration.subject_for(current_user.id)
        return if ::Mcp::Canary::Guard.oauth_request_allowed?(client_id: client_id, subject: subject)

        head :forbidden
      end
    end
  end
end
