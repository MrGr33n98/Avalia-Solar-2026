module Api
  module V1
    module Sales
      class AttributionController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          from_date = params[:from].presence || 30.days.ago

          sessions = attribution_sessions

          all_sessions = sessions.where('started_at >= ?', from_date)
          internal_count = all_sessions.where(traffic_class: 'internal').count
          sessions = all_sessions.where(traffic_class: ['commercial', nil])
          grouped = sessions.group(:utm_source, :utm_medium, :utm_campaign).count
          data = grouped.map do |keys, count|
            {
              source: keys[0].presence || 'direct',
              medium: keys[1].presence || 'none',
              campaign: keys[2].presence || 'none',
              sessions: count
            }
          end.sort_by { |item| -item[:sessions] }

          render json: { attribution: data, sessions: data, internal_sessions: internal_count }
        end

        private

        def attribution_sessions
          return ::Sales::TrackingSession.all if current_user.admin?

          scope = ::Sales::TenantScope.for(current_user)
          legacy = ::Sales::TrackingSession.where(account_id: scope.accounts.select(:id))
                                           .or(::Sales::TrackingSession.where(contact_id: scope.contacts.select(:id)))
          return legacy if current_user.company_id.blank?

          legacy.or(::Sales::TrackingSession.where(company_id: current_user.company_id))
        end
      end
    end
  end
end
