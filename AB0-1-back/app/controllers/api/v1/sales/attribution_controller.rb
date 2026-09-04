module Api
  module V1
    module Sales
      class AttributionController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          from_date = params[:from].presence || 30.days.ago

          sessions = if current_user.admin?
                       ::Sales::TrackingSession.all
                     else
                       acc_ids = ::Sales::TenantScope.for(current_user).accounts.select(:id)
                       cnt_ids = ::Sales::TenantScope.for(current_user).contacts.select(:id)
                       ::Sales::TrackingSession.where(account_id: acc_ids).or(::Sales::TrackingSession.where(contact_id: cnt_ids))
                     end

          sessions = sessions.where('started_at >= ?', from_date)
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
