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

          # Scope for period-based metrics (closed in period)
          scoped_opps = ::Sales::Opportunity.all
          scoped_opps = scoped_opps.where(updated_at: date_range) if date_range

          open_opps = ::Sales::Opportunity.open
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
            stage_opps = ::Sales::Opportunity.where(sales_stage_id: stage.id)
            {
              stage: stage.name,
              count: stage_opps.count,
              valor: (stage_opps.sum(:value_cents) / 100.0).round,
              value_cents: stage_opps.sum(:value_cents) || 0
            }
          end

          # Win / Loss Breakdown
          win_loss = []
          if total_closed.positive?
            win_pct = ((won_count.to_f / total_closed) * 100).round
            lost_pct = 100 - win_pct
            win_loss << { name: 'Ganhos (Won)', value: win_pct, color: '#10B981' }
            win_loss << { name: 'Perdidos (Lost)', value: lost_pct, color: '#EF4444' }
          end

          # Revenue by Month (last 6 months)
          revenue_by_month = (0..5).reverse_each.map do |i|
            m_start = i.months.ago.beginning_of_month
            m_end = i.months.ago.end_of_month
            month_label = m_start.strftime('%b/%Y')

            m_won = ::Sales::Opportunity.where(status: 'won', updated_at: m_start..m_end).sum(:value_cents) || 0
            m_pipe = ::Sales::Opportunity.open.where(created_at: ..m_end).sum('value_cents * COALESCE(probability, 0) / 100.0').to_i

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
            revenue_by_month: revenue_by_month
          }
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def parse_period(period)
          now = Time.current
          case period
          when 'this_month'
            now.beginning_of_month..now.end_of_month
          when 'last_month'
            1.month.ago.beginning_of_month..1.month.ago.end_of_month
          when 'last_quarter'
            3.months.ago.beginning_of_quarter..now.end_of_quarter
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
