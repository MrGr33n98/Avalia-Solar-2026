# frozen_string_literal: true

module Api
  module Oauth
    class TokensController < Doorkeeper::TokensController
      before_action :validate_mcp_resource!, only: :create
      before_action :validate_mcp_canary_request!, only: :create

      private

      def validate_mcp_resource!
        configuration = ::Mcp::Oauth::Configuration
        return unless configuration.resource_binding_required?
        return if configuration.valid_registered_resource_request?(params[:resource])

        render json: {
          error: 'invalid_target',
          error_description: 'O recurso OAuth solicitado não é um recurso MCP registrado.'
        }, status: :bad_request
      end

      def validate_mcp_canary_request!
        return unless ::Mcp::Canary::Configuration.enforced?
        return render_canary_error unless params[:resource] == ::Mcp::Canary::Configuration.canonical_resource

        case params[:grant_type].to_s
        when 'authorization_code'
          validate_authorization_code_canary_request!
        when 'refresh_token'
          validate_refresh_token_canary_request!
        else
          render_canary_error
        end
      rescue ActiveRecord::RecordNotFound
        render_canary_error
      end

      def validate_authorization_code_canary_request!
        return render_canary_error if params[:code_verifier].blank?

        grant = Doorkeeper::AccessGrant.by_token(params[:code].to_s)
        return render_canary_error unless grant

        subject = ::Mcp::Oauth::Configuration.subject_for(grant.resource_owner_id)
        allowed = ::Mcp::Canary::Guard.oauth_request_allowed?(
          client_id: params[:client_id].to_s, subject: subject,
          code_challenge_method: grant.code_challenge_method
        )
        render_canary_error unless allowed
      end

      def validate_refresh_token_canary_request!
        token = Doorkeeper::AccessToken.by_refresh_token(params[:refresh_token].to_s)
        return render_canary_error unless token&.accessible?
        return render_canary_error unless token.resource == ::Mcp::Canary::Configuration.canonical_resource
        return render_canary_error unless token.application&.uid == params[:client_id].to_s

        subject = ::Mcp::Oauth::Configuration.subject_for(token.resource_owner_id)
        allowed = ::Mcp::Canary::Guard.oauth_request_allowed?(
          client_id: params[:client_id].to_s, subject: subject
        )
        render_canary_error unless allowed
      end

      def render_canary_error
        render json: { error: 'access_denied', error_description: 'OAuth canary authorization denied.' },
               status: :forbidden
      end
    end
  end
end
