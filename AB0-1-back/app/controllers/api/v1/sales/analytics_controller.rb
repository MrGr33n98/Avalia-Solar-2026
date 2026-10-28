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

          # Pipeline & Funnel Breakdown by Stage
          target_pipeline = if params[:pipeline_id].present?
                              ::Sales::Pipeline.find_by(id: params[:pipeline_id])
                            end
          target_pipeline ||= ::Sales::Pipeline.order(:id).first

          stages = target_pipeline ? target_pipeline.stages.order(:position) : ::Sales::Stage.order(:position)
          pipeline_opps = target_pipeline ? tenant_opps.where(sales_pipeline_id: target_pipeline.id) : tenant_opps

          prev_stage_count = nil
          stages_arr = stages.to_a
          funnel = stages_arr.map.with_index do |stage, idx|
            stage_opps = pipeline_opps.where(sales_stage_id: stage.id)
            cnt = stage_opps.count
            val_cents = stage_opps.sum(:value_cents) || 0

            # Already vs Remain vs Added
            period_start = date_range ? date_range.first : 30.days.ago
            already_cnt = stage_opps.where('sales_opportunities.created_at < ?', period_start).count
            remain_cnt = stage_opps.where(status: 'open').count
            added_cnt = stage_opps.where('sales_opportunities.created_at >= ?', period_start).count

            # Average time in stage
            avg_days = if cnt.positive?
                         days_arr = stage_opps.pluck(:created_at, :updated_at).map do |cr, up|
                           [((up || Time.current) - cr) / 1.day, 0.5].max
                         end
                         (days_arr.sum / days_arr.size).round(1)
                       else
                         0.0
                       end

            # Advanced to subsequent stages
            next_stage = stages_arr[idx + 1]
            advanced_cnt = if next_stage
                             hist_cnt = ::Sales::StageHistory.where(
                               sales_opportunity_id: pipeline_opps.select(:id),
                               from_stage_id: stage.id,
                               to_stage_id: next_stage.id
                             ).count
                             hist_cnt.positive? ? hist_cnt : [pipeline_opps.where(sales_stage_id: next_stage.id).count, cnt].min
                           else
                             0
                           end

            pass_rate = if cnt.positive? && next_stage
                          ((advanced_cnt.to_f / cnt) * 100).round(1)
                        elsif prev_stage_count && prev_stage_count.positive?
                          ((cnt.to_f / prev_stage_count) * 100).round(1)
                        else
                          100.0
                        end
            pass_rate = [pass_rate, 100.0].min
            drop_rate = (100.0 - pass_rate).round(1)
            prev_stage_count = cnt if cnt.positive?

            # Stage outcomes
            won_cnt = stage_opps.where(status: 'won').count
            lost_cnt = stage_opps.where(status: 'lost').count
            cancelled_cnt = stage_opps.where(status: 'cancelled').count
            closed_cnt = won_cnt + lost_cnt + cancelled_cnt

            {
              id: stage.id,
              stage: stage.name,
              position: stage.position,
              count: cnt,
              valor: (val_cents / 100.0).round,
              value_cents: val_cents,
              conversion_rate_from_prev: pass_rate,
              drop_off_rate: drop_rate,
              already_count: already_cnt,
              remain_count: remain_cnt,
              added_count: added_cnt,
              average_time_days: avg_days,
              advanced_count: advanced_cnt,
              conversion_rate: pass_rate,
              closed_count: closed_cnt,
              closed_rate: cnt.positive? ? ((closed_cnt.to_f / cnt) * 100).round(1) : 0.0,
              won_count: won_cnt,
              won_rate: cnt.positive? ? ((won_cnt.to_f / cnt) * 100).round(1) : 0.0,
              lost_count: lost_cnt,
              lost_rate: cnt.positive? ? ((lost_cnt.to_f / cnt) * 100).round(1) : 0.0,
              cancelled_count: cancelled_cnt,
              cancelled_rate: cnt.positive? ? ((cancelled_cnt.to_f / cnt) * 100).round(1) : 0.0
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
          loss_reasons = ::Sales::Reporting::LossReasonsQuery.call(lost_scope: lost_opps)

          # Team Performance / Sales Rep Leaderboard
          team_performance = ::Sales::Reporting::TeamPerformanceQuery.call(scope: scoped_opps)

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
              lost_deals: lost_count,
              hot_deals: tenant_opps.open.where(temperature: 'hot').count,
              hot_deals_cents: tenant_opps.open.where(temperature: 'hot').sum(:value_cents) || 0
            },
            funnel: funnel,
            win_loss: win_loss,
            loss_reasons: loss_reasons,
            team_performance: team_performance,
            revenue_by_month: revenue_by_month,
            stage_durations: ::Sales::Reporting::StageDurationQuery.call(opportunity_scope: scoped_opps),
            task_performance: ::Sales::Reporting::TaskPerformanceQuery.call(user: current_user, date_range: date_range),
            top_products: ::Sales::Reporting::TopProductsQuery.call(opportunity_scope: won_opps),
            competitor_losses: ::Sales::Reporting::CompetitorLossesQuery.call(lost_scope: lost_opps),
            quota_attainment: ::Sales::Reporting::QuotaAttainmentQuery.call(user: current_user, won_scope: won_opps),
            revenue_installments: ::Sales::Reporting::RevenueInstallmentsQuery.call(opportunity_scope: scoped_opps),
            email_metrics: ::Sales::Reporting::EmailMetricsQuery.call(user: current_user, date_range: date_range),
            pipeline: target_pipeline ? { id: target_pipeline.id, name: target_pipeline.name, key: target_pipeline.key } : nil,
            pipelines: ::Sales::Pipeline.where(active: true).order(:id).map { |p| { id: p.id, name: p.name, key: p.key } }
          }
        end

        def email_engagement
          period = params[:period] || '30d'
          date_range = parse_engagement_period(period)

          events = ::Sales::TenantScope.for(current_user).email_events
          scoped_events = date_range ? events.where(occurred_at: date_range) : events

          sent_count = scoped_events.where(event_type: %w[sent provider_accepted queued]).count
          delivered_count = scoped_events.where(event_type: 'delivered').count
          unique_opens = scoped_events.where(event_type: %w[open open_signal provider_open_signal]).select(:sales_email_message_id).distinct.count
          unique_clicks = scoped_events.where(event_type: %w[click provider_click_signal]).select(:sales_email_message_id).distinct.count
          replied_count = scoped_events.where(event_type: 'replied').count
          bounce_count = scoped_events.where(event_type: %w[bounce reject failed]).count
          unsubscribed_count = scoped_events.where(event_type: %w[unsubscribed complaint]).count

          base_delivered = delivered_count.positive? ? delivered_count.to_f : (sent_count.positive? ? sent_count.to_f : 1.0)
          open_rate = ((unique_opens.to_f / base_delivered) * 100).round(1)
          click_rate = ((unique_clicks.to_f / base_delivered) * 100).round(1)
          bounce_rate = sent_count.positive? ? ((bounce_count.to_f / sent_count) * 100).round(1) : 0.0
          unsub_rate = sent_count.positive? ? ((unsubscribed_count.to_f / sent_count) * 100).round(1) : 0.0

          # Real daily engagement trend (last 7 days or date_range)
          trend_start = date_range ? date_range.begin : 7.days.ago.beginning_of_day
          trend_end = date_range ? date_range.end : Time.current.end_of_day

          daily_events = scoped_events.where(occurred_at: trend_start..trend_end)
                                      .group("DATE_TRUNC('day', occurred_at)")
                                      .group(:event_type)
                                      .count

          days_map = {}
          cur = trend_start.to_date
          while cur <= trend_end.to_date
            days_map[cur] = { day: I18n.l(cur, format: '%a'), emails: 0, opens: 0, clicks: 0, replies: 0 }
            cur += 1.day
          end

          daily_events.each do |(day_ts, type), count|
            d = day_ts.to_date
            next unless days_map[d]

            if %w[sent provider_accepted queued delivered].include?(type)
              days_map[d][:emails] += count
            elsif %w[open open_signal provider_open_signal].include?(type)
              days_map[d][:opens] += count
            elsif %w[click provider_click_signal].include?(type)
              days_map[d][:clicks] += count
            elsif type == 'replied'
              days_map[d][:replies] += count
            end
          end

          # Channel breakdown based on sales activity/events
          activities = ::Sales::TenantScope.for(current_user).activities
          scoped_activities = date_range ? activities.where(created_at: date_range) : activities
          email_act = scoped_activities.where(activity_type: 'email').count + sent_count
          call_act = scoped_activities.where(activity_type: 'call').count
          meeting_act = scoped_activities.where(activity_type: 'meeting').count
          whatsapp_act = scoped_activities.where(activity_type: %w[whatsapp message]).count
          total_acts = email_act + call_act + meeting_act + whatsapp_act

          channel_breakdown = if total_acts.positive?
                                [
                                  { name: 'E-mail Comercial', value: ((email_act.to_f / total_acts) * 100).round, color: '#3b82f6' },
                                  { name: 'WhatsApp B2B', value: ((whatsapp_act.to_f / total_acts) * 100).round, color: '#10b981' },
                                  { name: 'Ligações / Call', value: ((call_act.to_f / total_acts) * 100).round, color: '#f59e0b' },
                                  { name: 'Reunião Presencial', value: ((meeting_act.to_f / total_acts) * 100).round, color: '#8b5cf6' }
                                ]
                              else
                                [
                                  { name: 'E-mail Comercial', value: 100, color: '#3b82f6' }
                                ]
                              end

          render json: {
            metrics: {
              sent: sent_count,
              delivered: delivered_count,
              unique_opens: unique_opens,
              open_rate: open_rate,
              unique_clicks: unique_clicks,
              click_rate: click_rate,
              replied: replied_count,
              bounces: bounce_count,
              bounce_rate: bounce_rate,
              unsubscribed: unsubscribed_count,
              unsub_rate: unsub_rate
            },
            trend: days_map.values,
            channels: channel_breakdown
          }
        end

        private

        def parse_engagement_period(period)
          now = Time.current
          case period
          when '7d'
            7.days.ago.beginning_of_day..now.end_of_day
          when '30d'
            30.days.ago.beginning_of_day..now.end_of_day
          when '90d'
            90.days.ago.beginning_of_day..now.end_of_day
          else
            parse_period(period)
          end
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
