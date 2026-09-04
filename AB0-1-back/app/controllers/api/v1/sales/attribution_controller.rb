module Api
  module V1
    module Sales
      class AttributionController < BaseController
        def index
          sessions = ::Sales::TrackingSession.where('started_at >= ?', params[:from].presence || 30.days.ago)
          grouped = sessions.group(:utm_source, :utm_medium, :utm_campaign).count
          data = grouped.map do |keys, count|
            {
              source: keys[0].presence || 'direct',
              medium: keys[1].presence || 'none',
              campaign: keys[2].presence || 'none',
              sessions: count
            }
          end.sort_by { |item| -item[:sessions] }

          render json: { attribution: data, sessions: data }
        end
      end
    end
  end
end
