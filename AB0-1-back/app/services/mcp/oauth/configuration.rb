# frozen_string_literal: true

require 'uri'

module Mcp
  module Oauth
    module Configuration
      REQUIRED_SCOPE = 'mcp:public:read'
      PRIVATE_REQUIRED_SCOPE = 'mcp:company:read'
      DEFAULT_TOKEN_FORMAT = 'opaque'

      module_function

      def resource
        ENV['MCP_OAUTH_RESOURCE'].to_s
      end

      def private_resource
        ENV['MCP_PRIVATE_OAUTH_RESOURCE'].to_s
      end

      def issuer
        ENV['MCP_OAUTH_ISSUER'].to_s
      end

      def token_format
        ENV['MCP_OAUTH_TOKEN_FORMAT'].to_s.presence || DEFAULT_TOKEN_FORMAT
      end

      def opaque_tokens?
        token_format == DEFAULT_TOKEN_FORMAT
      end

      def configured?
        ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true' && https_uri?(issuer) && https_uri?(resource, path: '/mcp')
      rescue URI::InvalidURIError
        false
      end

      def private_configured?
        ENV['MCP_PRIVATE_REMOTE_OAUTH_ENABLED'] == 'true' && https_uri?(issuer) &&
          https_uri?(private_resource, path: '/mcp/private')
      rescue URI::InvalidURIError
        false
      end

      def resource_binding_required?
        ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true' || ENV['MCP_PRIVATE_REMOTE_OAUTH_ENABLED'] == 'true' ||
          resource.present? || private_resource.present? || issuer.present?
      end

      def valid_resource_request?(raw_resource)
        values = Array(raw_resource).flat_map { |value| value.to_s.split(',') }.reject(&:empty?)
        values.one? && values.first == resource
      end

      def valid_registered_resource_request?(raw_resource)
        values = Array(raw_resource).flat_map { |value| value.to_s.split(',') }.reject(&:empty?)
        registered_resources.include?(values.first) && values.one?
      end

      def endpoint(path)
        "#{issuer.sub(%r{/\z}, '')}/#{path.sub(%r{\A/}, '')}"
      end

      def authorization_endpoint
        endpoint('oauth/authorize')
      end

      def token_endpoint
        endpoint('oauth/token')
      end

      def revocation_endpoint
        endpoint('oauth/revoke')
      end

      def subject_for(resource_owner_id)
        id = Integer(resource_owner_id.to_s, 10)
        return if id.negative?

        "user:#{id}"
      rescue ArgumentError, TypeError
        nil
      end

      def https_uri?(raw, path: nil)
        uri = URI.parse(raw.to_s)
        https_host?(uri) && no_uri_credentials?(uri) && matching_path?(uri, path)
      end
      private_class_method :https_uri?

      def https_host?(uri)
        uri.is_a?(URI::HTTPS) && uri.host.present?
      end
      private_class_method :https_host?

      def no_uri_credentials?(uri)
        uri.userinfo.nil? && uri.query.nil? && uri.fragment.nil?
      end
      private_class_method :no_uri_credentials?

      def matching_path?(uri, path)
        path.nil? || uri.path == path
      end
      private_class_method :matching_path?

      def registered_resources
        [resource, private_resource].reject(&:blank?)
      end
      private_class_method :registered_resources
    end
  end
end
