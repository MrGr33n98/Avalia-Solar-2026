# frozen_string_literal: true

module Api
  module V1
    module Mcp
      class OauthMetadataController < ActionController::API
        def show
          configuration = ::Mcp::Oauth::Configuration
          return head :not_found unless configuration.configured? || configuration.private_configured?

          response.headers['Cache-Control'] = 'no-store'
          render json: {
            issuer: configuration.issuer,
            authorization_endpoint: configuration.authorization_endpoint,
            token_endpoint: configuration.token_endpoint,
            revocation_endpoint: configuration.revocation_endpoint,
            response_types_supported: ['code'],
            grant_types_supported: %w[authorization_code refresh_token],
            code_challenge_methods_supported: ['S256'],
            scopes_supported: [configuration::REQUIRED_SCOPE, configuration::PRIVATE_REQUIRED_SCOPE],
            token_endpoint_auth_methods_supported: %w[none client_secret_basic client_secret_post]
          }
        end
      end
    end
  end
end
