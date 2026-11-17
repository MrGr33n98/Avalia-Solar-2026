# frozen_string_literal: true

require 'digest'
require 'openssl'
require 'uri'

module Mcp
  module Oauth
    # Token verification for an external OAuth Authorization Server.
    # This class is a resource-server validator, NOT a token issuer or an AS.
    # No tokens, secrets or raw user data are logged.
    class ResourceAuthorization
      REQUIRED_SCOPE = 'mcp:public:read'
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
          return false unless ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true'

          resource = ENV['MCP_OAUTH_RESOURCE'].to_s
          issuer = ENV['MCP_OAUTH_ISSUER'].to_s
          pem = ENV['MCP_OAUTH_JWT_PUBLIC_KEY'].to_s
          return false unless https_uri?(resource, path: '/mcp') && https_uri?(issuer)
          return false if pem.bytesize < 256

          OpenSSL::PKey::RSA.new(pem).public?
        rescue OpenSSL::PKey::PKeyError, OpenSSL::PKey::RSAError, URI::InvalidURIError
          false
        end

        def resource
          ENV['MCP_OAUTH_RESOURCE'].to_s
        end

        def issuer
          ENV['MCP_OAUTH_ISSUER'].to_s
        end

        def metadata_url
          uri = URI.parse(resource)
          "#{uri.scheme}://#{uri.host}#{uri.port == 443 ? '' : ":#{uri.port}"}/.well-known/oauth-protected-resource/mcp"
        end

        private

        def https_uri?(raw, path: nil)
          uri = URI.parse(raw)
          return false unless uri.is_a?(URI::HTTPS) && uri.host.present?
          return false if uri.userinfo || uri.query || uri.fragment
          return false if path && uri.path != path

          true
        end
      end

      def initialize(authorization_header:)
        @authorization_header = authorization_header.to_s
      end

      def verify!
        raise Failure, :unavailable unless self.class.configured?

        matched = @authorization_header.match(/\ABearer ([A-Za-z0-9._~-]+)\z/)
        raise Failure, :missing_token if matched.nil?

        token = matched[1]
        raise Failure, :invalid_token if token.bytesize > MAX_BEARER_BYTES

        rsa = OpenSSL::PKey::RSA.new(ENV.fetch('MCP_OAUTH_JWT_PUBLIC_KEY'))
        claims, header = JWT.decode(
          token, rsa, true,
          algorithm: 'RS256',
          verify_iss: true, iss: self.class.issuer,
          verify_aud: true, aud: self.class.resource,
          required_claims: %w[iss aud sub exp iat jti]
        )
        raise Failure, :invalid_token unless header['alg'] == 'RS256'
        raise Failure, :invalid_token unless claims['sub'].is_a?(String) && claims['sub'].present?
        raise Failure, :invalid_token unless claims['jti'].is_a?(String) && claims['jti'].present?
        raise Failure, :invalid_token unless claims['exp'].is_a?(Integer) && claims['iat'].is_a?(Integer)
        raise Failure, :invalid_token unless claims['iat'] <= Time.current.to_i + TOKEN_LEEWAY_SECONDS
        raise Failure, :invalid_token if claims['exp'] <= Time.current.to_i - TOKEN_LEEWAY_SECONDS

        # Explicitly reject ID tokens. Tokens from the configured AS must be
        # JWT access tokens with OAuth scopes, not OIDC login credentials.
        header_type = header['typ'].to_s.downcase
        raise Failure, :invalid_token unless %w[at+jwt application/at+jwt].include?(header_type)

        scope = claims['scope']
        raise Failure, :invalid_token unless scope.is_a?(String) && scope.bytesize <= 1024

        scopes = scope.split(/\s+/).uniq
        raise Failure, :insufficient_scope unless scopes.include?(REQUIRED_SCOPE)

        digest = Digest::SHA256.hexdigest("#{self.class.issuer}:#{claims['jti']}")
        raise Failure, :invalid_token if Rails.cache.read("mcp:oauth:revoked:#{digest}")

        client_id = claims['client_id'] || claims['azp']
        client_id = nil unless client_id.is_a?(String) && client_id.present? && client_id.bytesize <= 256
        { subject: claims['sub'], client_id: client_id, token_id_digest: digest,
          scopes: scopes.freeze, issuer: self.class.issuer }.freeze
      rescue Failure
        raise
      rescue JWT::DecodeError, JWT::VerificationError, OpenSSL::PKey::PKeyError, OpenSSL::PKey::RSAError,
             ArgumentError, TypeError
        raise Failure, :invalid_token
      end
    end
  end
end
