module Api
  module V1
    class PushTokensController < BaseController
      before_action :authenticate_api_user

      def create
        token = params[:token].to_s.strip
        platform = params[:platform].to_s.strip.presence || 'expo'

        return render json: { error: 'Token is required' }, status: :unprocessable_entity if token.blank?
        return render json: { error: 'Invalid platform' }, status: :unprocessable_entity unless PushToken::PLATFORMS.include?(platform)

        push_token = PushToken.find_or_initialize_by(token: token)
        push_token.assign_attributes(
          user: current_user,
          platform: platform,
          device_id: params[:device_id],
          active: true,
          last_seen_at: Time.current
        )
        push_token.save!

        render json: {
          success: true,
          id: push_token.id,
          platform: push_token.platform,
          last_seen_at: push_token.last_seen_at
        }, status: :created
      end
    end
  end
end
