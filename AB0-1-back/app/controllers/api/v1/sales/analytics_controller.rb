# frozen_string_literal: true

module Api
  module V1
    module Sales
      class AnalyticsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          period = params[:period] || 'this_month'
          date_range = parse_period(period)

          tenant_opps = ::Sales::TenantScope.for(current_user).opportunities
          scoped_opps = date_range ? tenant_opps.where(updated_at: date_range) : tenant_opps

          open_opps = tenant_opps.open
          won_opps = scoped_opps.where(status: 'won')
          lost_opps = scoped_opps.where(status: 'lost')

          pipeline_value_cents = open_opps.sum(:value_cents) || 0
          weighted_pipeline_cents = open_opps.sum('value_cents * COALESCE(probability, 0) / 100.0').to_i

          won_revenue_cents = won_opps.sum(:value_cents) || 0
          won_count = won_opps.count
          lost_count = lost_opps.count
          total_closed = won_count + lost_count
          conversion_rate = total_closed.positive? ? (won_count.to_f / total_closed).round(4) : 0.0

          average_ticket_cents = won_count.positive? ? (won_revenue_cents / won_count) : 0

          avg_cycle_days = if won_count.positive?
                             cycles = won_opps.map { |o| ((o.updated_at - o.created_at) / 1.day).round }
                             (cycles.sum.to_f / cycles.size).round(1)
                           else
                             0.0
                           end

          # Funnel breakdown by Stage
          stages = ::Sales::Stage.order(:position)
          funnel = stages.map do |stage|
            stage_opps = tenant_opps.where(sales_stage_id: stage.id)
            {
              stage: stage.name,
              count: stage_opps.count,
              valor: (stage_opps.sum(:value_cents) / 100.0).round,
              value_cents: stage_opps.sum(:value_cents) || 0
            }
          end

          # Win / Loss Breakdown (Overall Rate)
          win_loss = []
          if total_closed.positive?
            win_pct = ((won_count.to_f / total_closed) * 100).round
            lost_pct = 100 - win_pct
            win_loss << { name: 'Ganhos (Won)', value: win_pct, color: '#10B981' }
            win_loss << { name: 'Perdidos (Lost)', value: lost_pct, color: '#EF4444' }
          end

          # Loss Reasons Breakdown
          loss_reasons = compute_loss_reasons(lost_opps)

          # Team Performance / Sales Rep Leaderboard
          team_performance = compute_team_performance(scoped_opps)

          # Revenue by Month (last 6 months)
          revenue_by_month = (0..5).reverse_each.map do |i|
            m_start = i.months.ago.beginning_of_month
            m_end = i.months.ago.end_of_month
            month_label = m_start.strftime('%b/%Y')

            m_won = tenant_opps.where(status: 'won', updated_at: m_start..m_end).sum(:value_cents) || 0
            m_pipe = tenant_opps.open.where(created_at: ..m_end).sum('value_cents * COALESCE(probability, 0) / 100.0').to_i

            {
              month: month_label,
              realizado: (m_won / 100.0).round,
              previsao: (m_pipe / 100.0).round,
              won_cents: m_won,
              pipeline_cents: m_pipe
            }
          end

          render json: {
            kpis: {
              pipeline_value_cents: pipeline_value_cents,
              weighted_pipeline_cents: weighted_pipeline_cents,
              won_revenue_cents: won_revenue_cents,
              conversion_rate: conversion_rate,
              average_ticket_cents: average_ticket_cents,
              average_sales_cycle_days: avg_cycle_days,
              open_deals: open_opps.count,
              won_deals: won_count,
              lost_deals: lost_count
            },
            funnel: funnel,
            win_loss: win_loss,
            loss_reasons: loss_reasons,
            team_performance: team_performance,
            revenue_by_month: revenue_by_month,
            email_metrics: email_metrics(date_range)
          }
        end

        private

        def compute_loss_reasons(lost_opps)
          total_lost = lost_opps.count
          return [] if total_lost.zero?

          grouped = lost_opps.group(:lost_reason).count
          colors = %w[#EF4444 #F59E0B #8B5CF6 #EC4899 #3B82F6 #6B7280]

          grouped.map.with_index do |(reason, count), idx|
            pct = ((count.to_f / total_lost) * 100).round
            {
              name: reason.presence || 'Não Especificado',
              count: count,
              value: pct,
              color: colors[idx % colors.length]
            }
          end
        end

        def compute_team_performance(scoped_opps)
          owner_ids = scoped_opps.pluck(:owner_id).uniq.compact
          users = User.where(id: owner_ids).index_by(&:id)

          owner_ids.map do |o_id|
            user = users[o_id]
            opps = scoped_opps.where(owner_id: o_id)
            won = opps.where(status: 'won')
            lost = opps.where(status: 'lost')
            total_closed = won.count + lost.count
            win_rate = total_closed.positive? ? ((won.count.to_f / total_closed) * 100).round(1) : 0.0

            {
              owner_id: o_id,
              name: user&.name.presence || user&.email&.split('@')&.first&.capitalize || "Vendedor ##{o_id}",
              email: user&.email || '',
              total_deals: opps.count,
              won_deals: won.count,
              lost_deals: lost.count,
              won_revenue_cents: won.sum(:value_cents) || 0,
              win_rate: win_rate
            }
          end.sort_by { |item| -item[:won_revenue_cents] }
        end

        def email_metrics(date_range)
          return {} unless defined?(::Sales::EmailEvent) && ActiveRecord::Base.connection.table_exists?('sales_email_events')

          events = ::Sales::EmailEvent.all
          events = events.where(occurred_at: date_range) if date_range

          %w[sent delivered open click replied bounce complaint].to_h do |event_type|
            [event_type, events.where(event_type: event_type).count]
          end
        rescue => e
          Rails.logger.warn("[AnalyticsController] email_metrics error: #{e.message}")
          {}
        end

        def parse_period(period)
          now = Time.current
          case period
          when 'this_week'
            now.beginning_of_week..now.end_of_week
          when 'this_month'
            now.beginning_of_month..now.end_of_month
          when 'last_month'
            1.month.ago.beginning_of_month..1.month.ago.end_of_month
          when 'this_quarter'
            now.beginning_of_quarter..now.end_of_quarter
          when 'last_quarter'
            3.months.ago.beginning_of_quarter..3.months.ago.end_of_quarter
          when 'ytd'
            now.beginning_of_year..now.end_of_year
          else
            nil
          end
        end
      end
    end
  end
end
