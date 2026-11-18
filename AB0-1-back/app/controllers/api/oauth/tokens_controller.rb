# frozen_string_literal: true

module Api
  module Oauth
    class TokensController < Doorkeeper::TokensController
      before_action :validate_mcp_resource!, only: :create

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
    end
  end
end
