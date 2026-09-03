require 'base64'
require 'net/http'
require 'openssl'
require 'uri'

module Sales
  module Messaging
    class SnsMessageVerifier
      ALLOWED_CERT_HOST = /\Asns\.[a-z0-9-]+\.amazonaws\.com\.?\z/i
      REQUIRED_FIELDS = %w[Type MessageId Timestamp TopicArn SignatureVersion Signature SigningCertURL].freeze

      def self.verify!(payload)
        new(payload).verify!
      end

      def initialize(payload)
        @payload = payload.stringify_keys
      end

      def verify!
        raise SecurityError, 'SNS payload inválido' unless REQUIRED_FIELDS.all? { |field| @payload[field].present? }
        raise SecurityError, 'SNS tipo inválido' unless %w[Notification SubscriptionConfirmation].include?(@payload['Type'])
        required_type_fields = @payload['Type'] == 'Notification' ? %w[Message] : %w[SubscribeURL Token]
        raise SecurityError, 'SNS campos do tipo ausentes' unless required_type_fields.all? { |field| @payload[field].present? }
        raise SecurityError, 'SNS tópico inválido' unless @payload['TopicArn'] == ENV['AWS_SNS_TOPIC_ARN']
        timestamp = Time.iso8601(@payload['Timestamp'])
        raise SecurityError, 'SNS timestamp expirado' if (Time.current - timestamp).abs > 300
        raise SecurityError, 'SNS certificado inválido' unless certificate_uri?
        certificate = OpenSSL::X509::Certificate.new(Net::HTTP.get(URI(@payload['SigningCertURL'])))
        digest = @payload['SignatureVersion'] == '2' ? OpenSSL::Digest::SHA256.new : OpenSSL::Digest::SHA1.new
        raise SecurityError, 'SNS assinatura inválida' unless certificate.public_key.verify(digest, Base64.strict_decode64(@payload['Signature']), canonical_string.encode)
        true
      rescue ArgumentError, URI::InvalidURIError, OpenSSL::OpenSSLError, Net::OpenTimeout, Net::ReadTimeout
        raise SecurityError, 'SNS assinatura inválida'
      end

      private

      def certificate_uri?
        uri = URI(@payload['SigningCertURL'])
        uri.scheme == 'https' && uri.host.match?(ALLOWED_CERT_HOST) && uri.path.end_with?('.pem')
      end

      def canonical_string
        keys = @payload['Type'] == 'Notification' ? %w[Message MessageId Subject Timestamp TopicArn Type] : %w[Message MessageId SubscribeURL Timestamp Token TopicArn Type]
        keys.filter_map { |key| @payload[key].present? ? "#{key}\n#{@payload[key]}\n" : nil }.join
      end
    end
  end
end
