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
          # Mapeia contas convertidas em vendas
          accounts_with_sessions = sessions.where.not(account_id: nil).pluck(:utm_source, :utm_medium, :utm_campaign, :account_id)
          account_ids = accounts_with_sessions.map(&:last).uniq
          won_opps = ::Sales::Opportunity.where(sales_account_id: account_ids, status: 'won')
                                          .group(:sales_account_id)
                                          .pluck(:sales_account_id, Arel.sql('COUNT(*)'), Arel.sql('COALESCE(SUM(value_cents), 0)::bigint'))
                                          .to_h { |acc_id, c, rev| [acc_id, { count: c, revenue: rev }] }

          channel_metrics = Hash.new { |h, k| h[k] = { sessions: 0, won_deals: 0, won_revenue_cents: 0 } }
          grouped.each do |keys, count|
            channel_metrics[keys][:sessions] += count
          end

          accounts_with_sessions.each do |src, med, camp, acc_id|
            if (won_data = won_opps[acc_id])
              keys = [src, med, camp]
              channel_metrics[keys][:won_deals] += won_data[:count]
              channel_metrics[keys][:won_revenue_cents] += won_data[:revenue]
            end
          end

          data = channel_metrics.map do |keys, metrics|
            {
              source: keys[0].presence || 'direct',
              medium: keys[1].presence || 'none',
              campaign: keys[2].presence || 'none',
              sessions: metrics[:sessions],
              won_deals: metrics[:won_deals],
              won_revenue_cents: metrics[:won_revenue_cents]
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
