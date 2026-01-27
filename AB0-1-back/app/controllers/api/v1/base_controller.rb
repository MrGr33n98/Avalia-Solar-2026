# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      # TASK-021: Include pagination
      include Paginatable
      
      # Skip CSRF for API requests
      skip_before_action :verify_authenticity_token
      
      # JSON responses by default
      respond_to :json
      # Error handling
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :bad_request
      
      private
      
      def require_role(*roles)
        unless current_user && roles.include?(current_user.role)
          Rails.logger.warn("[AccessDenied] user=#{current_user&.id || 'guest'} role=#{current_user&.role || 'none'} path=#{request.path} action=#{params[:action]}")
          return render_error_response(
            error: 'Forbidden',
            message: 'Not authorized to perform this action',
            status: :forbidden,
            code: 'FORBIDDEN'
          )
        end
      end

      def require_admin
        require_role('admin')
      end

      def require_company_user
        require_role('company')
      end

      def authenticate_api_user
        return if current_user

        render_error_response(
          error: 'Unauthorized',
          message: 'Authentication required',
          status: :unauthorized,
          code: 'UNAUTHORIZED'
        )
        false
      end

      def current_user
        @current_user ||= User.find_by(id: decoded_token[:user_id]) if decoded_token
      end

      def jwt_decode(token)
        begin
          JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first.with_indifferent_access
        rescue JWT::DecodeError
          nil
        end
      end

      def decoded_token
        # Try to get token from cookie first (new method)
        token = cookies.signed[:jwt_token]
        return jwt_decode(token) if token.present?

        # Fallback to header (old method) for migration
        header = request.headers['Authorization']
        return unless header

        token = header.split.last
        jwt_decode(token)
      end

      def render_error(message, status = :unprocessable_entity)
        error_label = status.to_s.tr('_', ' ').titleize
        render_error_response(error: error_label, message: message, status: status)
      end

      def render_error_response(error:, message:, status:, code: nil, details: nil, retry_after: nil)
        error_value = error.to_s
        payload = {
          error: error_value,
          message: message,
          code: code || error_value.gsub(/\s+/, '_').upcase
        }
        payload[:details] = details if details.present?

        response_headers = {}
        response_headers['Retry-After'] = retry_after.to_s if retry_after

        render json: payload, status: status, headers: response_headers
      end

      def not_found(exception)
        render_error_response(
          error: 'Not Found',
          message: exception.message,
          status: :not_found,
          code: 'NOT_FOUND'
        )
      end
      
      def unprocessable_entity(exception)
        render_error_response(
          error: 'Unprocessable Entity',
          message: exception.message,
          status: :unprocessable_entity,
          code: 'UNPROCESSABLE_ENTITY',
          details: exception.record&.errors&.full_messages
        )
      end
      
      def bad_request(exception)
        render_error_response(
          error: 'Bad Request',
          message: exception.message,
          status: :bad_request,
          code: 'BAD_REQUEST'
        )
      end
    end
  end
end
