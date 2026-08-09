module Api
  module V1
    class PushSubscriptionsController < BaseController
      before_action :authenticate_api_user

      def create
        subscription = current_user.push_subscriptions.find_or_initialize_by(
          endpoint: params[:endpoint]
        )
        
        subscription.assign_attributes(
          p256dh: params[:p256dh],
          auth: params[:auth]
        )

        if subscription.save
          render json: { success: true }, status: :ok
        else
          render json: { errors: subscription.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        subscription = current_user.push_subscriptions.find_by(endpoint: params[:endpoint])
        subscription&.destroy
        render json: { success: true }, status: :ok
      end
    end
  end
end
