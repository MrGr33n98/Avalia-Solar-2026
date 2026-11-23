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
        unless Configuration.configured?
          emit_security_event('canary_guard', 'unavailable')
          raise Failure, :unavailable
        end

        validate_token_context!
        case method
        when 'server/discover', 'initialize', 'ping', 'tools/list', 'notifications/initialized'
          true
        when 'tools/call'
          unless Configuration.execution_enabled?
            emit_security_event('canary_guard', 'execution_disabled')
            raise Failure, :execution_disabled
          end
          unless Configuration::PUBLIC_TOOLS.include?(tool_name)
            emit_security_event('canary_guard', 'tool_not_allowed')
            raise Failure, :tool_not_allowed
          end

          true
        else
          emit_security_event('canary_guard', 'method_not_allowed')
          raise Failure, :method_not_allowed
        end
      end

      private

      def validate_token_context!
        unless @auth_context.is_a?(Hash) &&
               @auth_context[:token_format].to_s == 'opaque' &&
               Configuration.canonical_resource.present? &&
               @auth_context[:resource] == Configuration.canonical_resource &&
               Array(@auth_context[:scopes]).include?(Mcp::Oauth::Configuration::REQUIRED_SCOPE) &&
               Configuration.client_allowed?(@auth_context[:client_id]) &&
               Configuration.subject_allowed?(@auth_context[:subject])
          emit_security_event('canary_guard', 'forbidden')
          raise Failure, :forbidden
        end
      end

      def emit_security_event(event_type, reason)
        ActiveSupport::Notifications.instrument(
          'mcp.security.event',
          surface: 'remote',
          event_type: event_type,
          reason: reason
        )
      rescue StandardError => e
        Rails.logger.warn("[MCP Guard Telemetry] error=#{e.class}")
      end
    end
  end
end
