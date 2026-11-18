# frozen_string_literal: true

module Api
  module V1
    module Mcp
      class PrivateTransportController < ActionController::API
        MAX_BODY_BYTES = 32_768

        before_action :deny_unconfigured!
        before_action :validate_host!
        before_action :validate_origin!
        before_action :authorize_request!, only: :create
        skip_before_action :validate_host!, :validate_origin!, :authorize_request!, only: :resource_metadata

        def create
          unless request.media_type == 'application/json'
            return rpc_error(nil, 'Content-Type must be application/json.',
                             :unsupported_media_type)
          end
          if request.content_length.to_i > MAX_BODY_BYTES
            return rpc_error(nil, 'Request exceeds maximum size.',
                             :payload_too_large)
          end

          raw = request.body.read(MAX_BODY_BYTES + 1)
          return rpc_error(nil, 'Request exceeds maximum size.', :payload_too_large) if raw.bytesize > MAX_BODY_BYTES

          outcome = ::Mcp::Private::Protocol.new(message: JSON.parse(raw), user: @mcp_private_user).response
          render json: outcome[:body], status: outcome[:status]
        rescue JSON::ParserError
          rpc_error(nil, 'Parse error.', :bad_request)
        end

        def resource_metadata
          return head :not_found unless ::Mcp::Oauth::Configuration.private_configured?

          render json: {
            resource: ::Mcp::Oauth::Configuration.private_resource,
            authorization_servers: [::Mcp::Oauth::Configuration.issuer],
            scopes_supported: [::Mcp::Oauth::Configuration::PRIVATE_REQUIRED_SCOPE],
            bearer_methods_supported: ['header']
          }, status: :ok
        end

        def unsupported
          response.headers['Allow'] = 'POST'
          head :method_not_allowed
        end

        private

        def deny_unconfigured!
          return head :not_found unless ENV['MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED'] == 'true'
          return head :not_found if Rails.env.production? && ENV['MCP_REMOTE_PRODUCTION_ENABLED'] != 'true'

          head :not_found unless ::Mcp::Oauth::Configuration.private_configured?
        end

        def validate_host!
          allowed = ENV['MCP_PRIVATE_ALLOWED_HOSTS'].to_s.split(',').map(&:strip).reject(&:blank?)
          head :forbidden unless allowed.include?(request.host)
        end

        def validate_origin!
          origin = request.headers['Origin'].to_s
          return if origin.blank?

          allowed = ENV['MCP_PRIVATE_ALLOWED_ORIGINS'].to_s.split(',').map(&:strip).reject(&:blank?)
          head :forbidden unless allowed.include?(origin)
        end

        def authorize_request!
          context = ::Mcp::Oauth::PrivateResourceAuthorization.new(
            authorization_header: request.headers['Authorization']
          ).verify!
          @mcp_private_user = User.find(context.fetch(:resource_owner_id))
        rescue ::Mcp::Oauth::PrivateResourceAuthorization::Failure => e
          return head :not_found if e.type == :unavailable

          if e.type == :insufficient_scope
            response.headers['WWW-Authenticate'] = 'Bearer error="insufficient_scope", scope="mcp:company:read"'
            return head :forbidden
          end

          response.headers['WWW-Authenticate'] = 'Bearer error="invalid_token"'
          head :unauthorized
        end

        def rpc_error(id, message, status)
          render json: { jsonrpc: '2.0', id: id, error: { code: -32_600, message: message } }, status: status
        end
      end
    end
  end
end
