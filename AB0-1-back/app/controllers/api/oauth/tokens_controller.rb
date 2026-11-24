# frozen_string_literal: true

module Api
  module Oauth
    class TokensController < Doorkeeper::TokensController
      before_action :set_and_validate_mcp_resource!, only: :create
      before_action :validate_mcp_canary_request!, only: :create

      private

      def set_and_validate_mcp_resource!
        res = resolved_resource
        params[:resource] = res if res.present? && params[:resource].blank?
        validate_mcp_resource!
      end

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
        return if private_oauth_request?
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

      def private_oauth_request?
        params[:resource] == ::Mcp::Oauth::Configuration.private_resource &&
          ::Mcp::Oauth::Configuration.private_configured?
      end

      def resolved_resource
        case params[:grant_type].to_s
        when 'authorization_code'
          grant = Doorkeeper::AccessGrant.by_token(params[:code].to_s)
          grant_resource = grant&.resource if grant.respond_to?(:resource)
          return nil if grant_resource.present? && params[:resource].present? && params[:resource] != grant_resource

          params[:resource].presence || grant_resource
        when 'refresh_token'
          token = Doorkeeper::AccessToken.by_refresh_token(params[:refresh_token].to_s)
          token_resource = token&.resource if token.respond_to?(:resource)
          return nil if token_resource.present? && params[:resource].present? && params[:resource] != token_resource

          params[:resource].presence || token_resource
        else
          params[:resource]
        end
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
