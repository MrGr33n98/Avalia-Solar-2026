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
          return render json: { error: 'Forbidden' }, status: :forbidden
        end
      end

      def require_admin
        require_role('admin')
      end

      def require_company_user
        require_role('company')
      end

      def authenticate_api_user
        render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user
      end

      def current_user
        @current_user ||= User.find_by(id: decoded_token[:user_id]) if decoded_token
      end

      def decoded_token
        header = request.headers['Authorization']
        return unless header

        token = header.split.last
        begin
          JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first.with_indifferent_access
        rescue JWT::DecodeError
          nil
        end
      end

      def render_error(message, status = :unprocessable_entity)
        render json: { error: message }, status: status
      end

      def not_found(exception)
        render json: {
          error: 'Not Found',
          message: exception.message
        }, status: :not_found
      end
      
      def unprocessable_entity(exception)
        render json: {
          error: 'Unprocessable Entity',
          message: exception.message,
          details: exception.record&.errors&.full_messages
        }, status: :unprocessable_entity
      end
      
      def bad_request(exception)
        render json: {
          error: 'Bad Request',
          message: exception.message
        }, status: :bad_request
      end
    end
  end
end
