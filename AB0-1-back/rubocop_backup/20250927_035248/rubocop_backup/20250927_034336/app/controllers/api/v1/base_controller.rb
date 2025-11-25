# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :set_default_format
      # before_action :authenticate_api_user, except: [:index, :show]

      private

      def set_default_format
        request.format = :json
      end

      def authenticate_api_user
        puts "Authenticating for action: #{action_name}"
        render_error('Not authorized', :unauthorized) unless current_user
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
    end
  end
end
