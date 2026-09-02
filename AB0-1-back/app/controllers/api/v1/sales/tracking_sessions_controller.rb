module Api
  module V1
    module Sales
      class TrackingSessionsController < BaseController
        skip_before_action :authenticate_api_user
        skip_before_action :require_internal_sales

        def create
          session = ::Sales::TrackingSession.create!(session_params.merge(started_at: Time.current))
          render json: { session_id: session.session_id }, status: :created
        end

        def update
          session = ::Sales::TrackingSession.find_by!(session_id: params[:id])
          session.update!(session_params)
          render json: { session_id: session.session_id, account_id: session.account_id, contact_id: session.contact_id }
        end

        private

        def session_params
          params.require(:session).permit(:session_id, :anonymous_id, :account_id, :contact_id,
                                          :utm_source, :utm_medium, :utm_campaign, :ended_at)
        end
      end
    end
  end
end
