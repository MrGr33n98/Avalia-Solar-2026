# frozen_string_literal: true

require 'digest'
require 'openssl'
require 'uri'

module Mcp
  module Oauth
    # Resource Server do MCP. No modo self-hosted, o Doorkeeper continua sendo
    # a fonte de verdade do token, da revogação e do vínculo com o usuário.
    # JWT só é aceito quando habilitado explicitamente para compatibilidade legada.
    class ResourceAuthorization
      REQUIRED_SCOPE = Configuration::REQUIRED_SCOPE
      MAX_BEARER_BYTES = 8_192
      TOKEN_LEEWAY_SECONDS = 15

      class Failure < StandardError
        attr_reader :type

        def initialize(type)
          @type = type
          super(type.to_s)
        end
      end

      class << self
        def configured?
          return false unless Configuration.configured?
          return true if Configuration.opaque_tokens?

          pem = ENV['MCP_OAUTH_JWT_PUBLIC_KEY'].to_s
          return false if pem.bytesize < 256

          OpenSSL::PKey::RSA.new(pem).public?
        rescue OpenSSL::PKey::PKeyError, URI::InvalidURIError
          false
        end

        delegate :resource, :issuer, to: Configuration

        def metadata_url
          uri = URI.parse(resource)
          host = uri.host
          host = "#{host}:#{uri.port}" unless uri.port == 443
          "#{uri.scheme}://#{host}/.well-known/oauth-protected-resource/mcp"
        end
      end

      def initialize(authorization_header:)
        @authorization_header = authorization_header.to_s
      end

      def verify!
        raise Failure, :unavailable unless self.class.configured?

        token = bearer_token
        return verify_opaque!(token) if Configuration.opaque_tokens?

        verify_jwt!(token)
      rescue Failure
        raise
      rescue JWT::DecodeError, JWT::VerificationError, OpenSSL::PKey::PKeyError,
             ArgumentError, TypeError, ActiveRecord::RecordNotFound
        raise Failure, :invalid_token
      end

      private

      def bearer_token
        matched = @authorization_header.match(%r{\ABearer ([A-Za-z0-9._~+/=:-]+)\z})
        raise Failure, :missing_token if matched.nil?

        token = matched[1]
        raise Failure, :invalid_token if token.bytesize > MAX_BEARER_BYTES

        token
      end

      def verify_opaque!(raw_token)
        token = opaque_token(raw_token)
        scopes = token_scopes(token.scopes)
        subject, client_id = token_identity(token)
        digest = token_digest(token.id)
        raise Failure, :invalid_token if revoked?(digest)

        { subject: subject, client_id: client_id, token_id_digest: digest,
          scopes: scopes.freeze, issuer: self.class.issuer }.freeze
      end

      def opaque_token(raw_token)
        token = Doorkeeper.config.access_token_model.by_token(raw_token)
        raise Failure, :invalid_token unless token&.accessible?
        raise Failure, :invalid_token unless token.respond_to?(:resource) && token.resource == self.class.resource

        token
      end

      def token_scopes(raw_scopes)
        scopes = raw_scopes.to_s.split(/\s+/).reject(&:empty?).uniq
        raise Failure, :insufficient_scope unless scopes.include?(REQUIRED_SCOPE)

        scopes
      end

      def token_identity(token)
        subject = Configuration.subject_for(token.resource_owner_id)
        client_id = token.application&.uid.to_s
        raise Failure, :invalid_token if subject.blank? || client_id.blank?

        [subject, client_id]
      end

      def verify_jwt!(raw_token)
        claims, header = decode_jwt(raw_token)
        validate_jwt_claims!(claims, header)
        scopes = jwt_scopes(claims['scope'])

        digest = token_digest(claims.fetch('jti'))
        raise Failure, :invalid_token if revoked?(digest)

        { subject: claims['sub'], client_id: jwt_client_id(claims), token_id_digest: digest,
          scopes: scopes.freeze, issuer: self.class.issuer }.freeze
      end

      def decode_jwt(raw_token)
        rsa = OpenSSL::PKey::RSA.new(ENV.fetch('MCP_OAUTH_JWT_PUBLIC_KEY'))
        JWT.decode(
          raw_token, rsa, true,
          algorithm: 'RS256',
          verify_iss: true, iss: self.class.issuer,
          verify_aud: true, aud: self.class.resource,
          required_claims: %w[iss aud sub exp iat jti]
        )
      end

      def validate_jwt_claims!(claims, header)
        raise Failure, :invalid_token unless header['alg'] == 'RS256'
        raise Failure, :invalid_token unless valid_jwt_identity?(claims)
        raise Failure, :invalid_token unless valid_jwt_times?(claims)
        raise Failure, :invalid_token unless valid_access_token_type?(header)
      end

      def valid_jwt_identity?(claims)
        claims['sub'].is_a?(String) && claims['sub'].present? &&
          claims['jti'].is_a?(String) && claims['jti'].present?
      end

      def valid_jwt_times?(claims)
        claims['exp'].is_a?(Integer) && claims['iat'].is_a?(Integer) &&
          claims['iat'] <= Time.current.to_i + TOKEN_LEEWAY_SECONDS &&
          claims['exp'] > Time.current.to_i - TOKEN_LEEWAY_SECONDS
      end

      def valid_access_token_type?(header)
        %w[at+jwt application/at+jwt].include?(header['typ'].to_s.downcase)
      end

      def jwt_scopes(raw_scope)
        raise Failure, :invalid_token unless raw_scope.is_a?(String) && raw_scope.bytesize <= 1024

        scopes = raw_scope.split(/\s+/).uniq
        raise Failure, :insufficient_scope unless scopes.include?(REQUIRED_SCOPE)

        scopes
      end

      def jwt_client_id(claims)
        client_id = claims['client_id'] || claims['azp']
        return if !client_id.is_a?(String) || client_id.blank? || client_id.bytesize > 256

        client_id
      end

      def revoked?(digest)
        Rails.cache.read("mcp:oauth:revoked:#{digest}")
      end

      def token_digest(identifier)
        Digest::SHA256.hexdigest("#{self.class.issuer}:#{identifier}")
      end
    end
  end
end
