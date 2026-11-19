# frozen_string_literal: true

module Mcp
  module Canary
    # Authorization boundary applied after Doorkeeper verifies the bearer token
    # and before any MCP response or public tool execution is produced.
    class Guard
      class Failure < StandardError
        attr_reader :type

        def initialize(type)
          @type = type
          super(type.to_s)
        end
      end

      def self.authorize!(method:, auth_context:, tool_name: nil)
        new(auth_context: auth_context).authorize!(method: method, tool_name: tool_name)
      end

      def self.oauth_request_allowed?(client_id:, subject:, code_challenge_method: nil)
        return true unless Configuration.enforced?
        return false unless Configuration.configured?
        return false unless Configuration.client_allowed?(client_id)
        return false unless Configuration.subject_allowed?(subject)
        return false unless code_challenge_method.nil? || code_challenge_method == 'S256'

        true
      end

      def initialize(auth_context:)
        @auth_context = auth_context
      end

      def authorize!(method:, tool_name: nil)
        return true unless Configuration.enforced?
        raise Failure, :unavailable unless Configuration.configured?

        validate_token_context!
        case method
        when 'server/discover', 'initialize', 'ping', 'tools/list'
          true
        when 'tools/call'
          raise Failure, :execution_disabled unless Configuration.execution_enabled?
          raise Failure, :tool_not_allowed unless Configuration::PUBLIC_TOOLS.include?(tool_name)

          true
        else
          raise Failure, :method_not_allowed
        end
      end

      private

      def validate_token_context!
        raise Failure, :forbidden unless @auth_context.is_a?(Hash)
        raise Failure, :forbidden unless @auth_context[:token_format].to_s == 'opaque'
        raise Failure, :forbidden unless @auth_context[:resource] == Configuration::CANONICAL_RESOURCE
        unless Array(@auth_context[:scopes]).include?(Mcp::Oauth::Configuration::REQUIRED_SCOPE)
          raise Failure, :forbidden
        end
        raise Failure, :forbidden unless Configuration.client_allowed?(@auth_context[:client_id])
        raise Failure, :forbidden unless Configuration.subject_allowed?(@auth_context[:subject])
      end
    end
  end
end
