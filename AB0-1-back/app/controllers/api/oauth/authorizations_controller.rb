# frozen_string_literal: true

module Api
  module Oauth
    class AuthorizationsController < Doorkeeper::AuthorizationsController
      before_action :validate_mcp_resource!, only: %i[new create destroy]

      private

      def validate_mcp_resource!
        configuration = ::Mcp::Oauth::Configuration
        return unless configuration.resource_binding_required?
        return if configuration.configured? && configuration.valid_resource_request?(params[:resource])

        render json: {
          error: 'invalid_target',
          error_description: 'O recurso OAuth solicitado não é o MCP público registrado.'
        }, status: :bad_request
      end
    end
  end
end
