module Api
  module V1
    module Sales
      class TrackingEventsController < BaseController
        skip_before_action :authenticate_api_user, only: :create
        skip_before_action :require_internal_sales, only: :create

        def create
          event = ::Sales::TrackingEvent.create!(event_params.merge(occurred_at: Time.current))
          render json: { event_id: event.id }, status: :accepted
        end

        private

        def event_params
          params.require(:event).permit(:account_id, :contact_id, :session_id, :event_name, :path, properties: {})
        end
      end
    end
  end
end
