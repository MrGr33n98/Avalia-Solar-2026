module Api
  module V1
    module Sales
      class AttributionController < BaseController
        def index
          sessions = ::Sales::TrackingSession.where('started_at >= ?', params[:from].presence || 30.days.ago)
          grouped = sessions.group(:utm_source, :utm_medium, :utm_campaign).count
          render json: { attribution: grouped.map { |keys, count| { source: keys[0], medium: keys[1], campaign: keys[2], sessions: count } } }
        end
      end
    end
  end
end
