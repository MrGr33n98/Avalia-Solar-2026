# frozen_string_literal: true

require 'uri'

module Sales
  module Messaging
    class TrackingHost
      class ConfigurationError < StandardError; end

      def self.origin
        uri = URI.parse(configured_origin)
        validate_origin!(uri)
        format_origin(uri)
      rescue KeyError, URI::InvalidURIError
        raise ConfigurationError, 'EMAIL_TRACKING_HOST ausente ou inválido.'
      end

      def self.configured?
        origin
        true
      rescue ConfigurationError
        false
      end

      def self.configured_origin
        host = ENV['EMAIL_TRACKING_HOST'].presence || ENV['APP_HOST'].presence
        if Rails.env.production?
          host = host.present? ? (host.start_with?('http') ? host : "https://#{host}") : 'https://app.avaliasolar.com.br'
          return host
        end

        host.presence || 'http://localhost:3001'
      end
      private_class_method :configured_origin

      def self.validate_origin!(uri)
        unless valid_http_origin?(uri)
          raise ConfigurationError, 'EMAIL_TRACKING_HOST deve ser uma origem HTTP(S), sem caminho.'
        end
        return unless Rails.env.production? && !uri.is_a?(URI::HTTPS)

        raise ConfigurationError, 'EMAIL_TRACKING_HOST deve usar HTTPS em produção.'
      end
      private_class_method :validate_origin!

      def self.valid_http_origin?(uri)
        uri.is_a?(URI::HTTP) && uri.host.present? && uri.userinfo.blank? && uri.path.blank? &&
          uri.query.blank? && uri.fragment.blank?
      end
      private_class_method :valid_http_origin?

      def self.format_origin(uri)
        port = ":#{uri.port}" unless uri.default_port == uri.port
        "#{uri.scheme}://#{uri.host}#{port}"
      end
      private_class_method :format_origin
    end
  end
end
