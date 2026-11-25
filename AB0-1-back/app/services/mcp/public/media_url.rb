# frozen_string_literal: true

require 'uri'

module Mcp
  module Public
    # O iframe recebe somente origens HTTPS explicitamente autorizadas no CSP.
    class MediaUrl
      def self.allowed(value)
        return unless value.is_a?(String) && value.bytesize <= 2048

        uri = URI.parse(value)
        return unless uri.is_a?(URI::HTTPS) && uri.host.present? && uri.userinfo.nil?

        origin = uri.port == 443 ? "https://#{uri.host}" : "https://#{uri.host}:#{uri.port}"
        origins = ENV['MCP_UI_RESOURCE_DOMAINS'].to_s.split(',').map(&:strip)
        value if origins.include?(origin)
      rescue URI::InvalidURIError
        nil
      end
    end
  end
end
