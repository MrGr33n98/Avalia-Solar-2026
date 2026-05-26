# frozen_string_literal: true

require 'uri'

module Api
  module V1
    class BaseController < ApplicationController
      # TASK-021: Include pagination
      include Paginatable
      include Pundit::Authorization

      # Skip CSRF for API requests
      skip_before_action :verify_authenticity_token

      # Capture Edge Geolocation data from Cloudflare Worker
      before_action :capture_edge_location

      # JSON responses by default
      respond_to :json
      # Error handling
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :bad_request
      rescue_from Pundit::NotAuthorizedError, with: :authorization_error

      private

      def require_role(*roles)
        return if current_user && roles.include?(current_user.role)

        Rails.logger.warn("[AccessDenied] user=#{current_user&.id || 'guest'} role=#{current_user&.role || 'none'} path=#{request.path} action=#{params[:action]}")
        render_error_response(
          message: 'Not authorized to perform this action',
          status: :forbidden,
          code: 'FORBIDDEN'
        )
      end

      def require_admin
        require_role('admin')
      end

      def require_company_user
        return if current_user&.admin?
        return if current_user&.active_company_members&.exists?

        render_error_response(
          message: 'Acesso à gestão da empresa requer autorização aprovada.',
          status: :forbidden,
          code: 'COMPANY_ACCESS_REQUIRED'
        )
      end

      def authenticate_api_user
        return render_unauthorized unless current_user

        true
      end

      def current_user
        @current_user ||= User.find_by(id: decoded_token[:user_id]) if decoded_token
      end

      def jwt_decode(token)
        JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first.with_indifferent_access
      rescue JWT::DecodeError
        nil
      end

      def decoded_token
        # Fallback to header (old method) for migration
        header = request.headers['Authorization']
        if header.present?
          token = header.split.last
          decoded = jwt_decode(token)
          return decoded if decoded
        end

        # Try to get token from cookie first (new method)
        token = cookies.signed[:jwt_token]
        jwt_decode(token) if token.present?
      end

      def render_error(message, status = :unprocessable_entity, code: nil)
        code ||= status.to_s.upcase
        render_error_response(message: message, status: status, code: code)
      end

      def render_unauthorized
        render_error_response(
          message: 'Authentication required',
          status: :unauthorized,
          code: 'UNAUTHORIZED'
        )
        false
      end

      def render_error_response(message:, status:, code:, details: nil, retry_after: nil)
        payload = {
          code: code.to_s.upcase,
          message: message
        }
        payload[:details] = details if details.present?

        response_headers = {}
        response_headers['Retry-After'] = retry_after.to_s if retry_after

        render json: payload, status: status, headers: response_headers
      end

      def capture_edge_location
        @edge_location = {
          city: request.headers['X-User-City'],
          state: request.headers['X-User-State'],
          country: request.headers['X-User-Country'],
          request_id: request.headers['X-Request-ID'],
          signature: request.headers['X-Edge-Signature'],
          time: request.headers['X-Edge-Time']
        }.compact

        # Verify signature if SHARED_SECRET is present
        @edge_verified = verify_edge_signature if @edge_location[:signature].present?
      end

      def request_metadata
        ref = sanitized_referrer
        meta = {
          ip: request.remote_ip.to_s,
          referrer_host: ref[:host],
          referrer_path: ref[:path],
          user_agent: request.user_agent.to_s,
          path: request.path.to_s,
          city: @edge_location&.dig(:city),
          state: @edge_location&.dig(:state)
        }

        utm_params = params.permit(:utm_source, :utm_medium, :utm_campaign, :utm_term, :utm_content, :gclid, :fbclid,
                                   :msclkid).to_h
        utm_clean = utm_params.transform_values { |v| normalize_utm(v) }.compact
        meta.merge!(utm_clean) if utm_clean.present?

        meta.compact
      end

      def sanitized_referrer
        return { host: nil, path: nil } if request.referer.blank?

        uri = begin
          URI.parse(request.referer)
        rescue StandardError
          nil
        end
        { host: uri&.host, path: uri&.path }
      end

      def normalize_utm(value)
        return nil if value.blank?

        value.to_s.downcase.strip.gsub(/[^a-z0-9_.-]/, '')[0, 255]
      end

      def verify_edge_signature
        secret = ENV.fetch('SHARED_SECRET', nil)
        return false if secret.blank?

        data = "#{@edge_location[:time]}#{@edge_location[:request_id]}#{@edge_location[:city]}#{@edge_location[:state]}"
        expected_signature = OpenSSL::HMAC.hexdigest('SHA256', secret, data)

        ActiveSupport::SecurityUtils.secure_compare(expected_signature, @edge_location[:signature])
      rescue StandardError => e
        Rails.logger.warn "Edge Signature Verification Failed: #{e.message}"
        false
      end

      def not_found(exception)
        render_error_response(
          message: exception.message,
          status: :not_found,
          code: 'NOT_FOUND'
        )
      end

      def unprocessable_entity(exception)
        render_error_response(
          message: exception.message,
          status: :unprocessable_entity,
          code: 'UNPROCESSABLE_ENTITY',
          details: exception.record&.errors&.full_messages
        )
      end

      def bad_request(exception)
        render_error_response(
          message: exception.message,
          status: :bad_request,
          code: 'BAD_REQUEST'
        )
      end

      def authorization_error(exception)
        render_error_response(
          message: 'You are not authorized to access this resource',
          status: :forbidden,
          code: 'AUTHORIZATION_ERROR'
        )
      end
    end
  end
end
