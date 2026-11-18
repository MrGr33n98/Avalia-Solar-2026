# frozen_string_literal: true

require 'digest'

module Mcp
  module Oauth
    class PrivateResourceAuthorization
      MAX_BEARER_BYTES = 8_192

      class Failure < StandardError
        attr_reader :type

        def initialize(type)
          @type = type
          super(type.to_s)
        end
      end

      def initialize(authorization_header:)
        @authorization_header = authorization_header.to_s
      end

      def verify!
        ensure_configured!
        token = verified_token
        token_scopes = verified_scopes(token)
        verified_user!(token)
        build_context(token, token_scopes)
      rescue Failure
        raise
      rescue ActiveRecord::RecordNotFound, ArgumentError, TypeError
        raise Failure, :invalid_token
      end

      private

      def ensure_configured!
        raise Failure, :unavailable unless Configuration.private_configured?
      end

      def verified_token
        token = access_token(bearer_token)
        raise Failure, :invalid_token unless token&.accessible?
        raise Failure, :invalid_token unless token.resource == Configuration.private_resource

        token
      end

      def verified_scopes(token)
        token_scopes = scopes(token.scopes)
        raise Failure, :insufficient_scope unless token_scopes.include?(Configuration::PRIVATE_REQUIRED_SCOPE)

        token_scopes
      end

      def verified_user!(token)
        user = User.find_by(id: token.resource_owner_id)
        raise Failure, :invalid_token unless user&.active_for_authentication?
      end

      def build_context(token, token_scopes)
        client_id = token.application&.uid.to_s
        raise Failure, :invalid_token if client_id.blank?

        {
          subject: Configuration.subject_for(token.resource_owner_id),
          client_id: client_id,
          resource_owner_id: token.resource_owner_id,
          token_id_digest: Digest::SHA256.hexdigest("#{Configuration.issuer}:#{token.id}"),
          scopes: token_scopes.freeze,
          issuer: Configuration.issuer,
          resource: Configuration.private_resource
        }.freeze
      end

      def bearer_token
        matched = @authorization_header.match(%r{\ABearer ([A-Za-z0-9._~+/=:-]+)\z})
        raise Failure, :missing_token if matched.nil?

        token = matched[1]
        raise Failure, :invalid_token if token.bytesize > MAX_BEARER_BYTES

        token
      end

      def access_token(raw_token)
        Doorkeeper.config.access_token_model.by_token(raw_token)
      end

      def scopes(raw_scopes)
        raw_scopes.to_s.split(/\s+/).reject(&:empty?).uniq
      end
    end
  end
end
