# frozen_string_literal: true

module Api
  module V1
    module Mcp
      class OauthMetadataController < ActionController::API
        def show
          return head :not_found unless ::Mcp::Oauth::Configuration.configured?

          response.headers['Cache-Control'] = 'no-store'
          render json: {
            issuer: ::Mcp::Oauth::Configuration.issuer,
            authorization_endpoint: ::Mcp::Oauth::Configuration.authorization_endpoint,
            token_endpoint: ::Mcp::Oauth::Configuration.token_endpoint,
            revocation_endpoint: ::Mcp::Oauth::Configuration.revocation_endpoint,
            response_types_supported: ['code'],
            grant_types_supported: %w[authorization_code refresh_token],
            code_challenge_methods_supported: ['S256'],
            scopes_supported: [::Mcp::Oauth::Configuration::REQUIRED_SCOPE],
            token_endpoint_auth_methods_supported: %w[none client_secret_basic client_secret_post]
          }
        end
      end
    end
  end
end
