# frozen_string_literal: true

class AnalyticsEvent < ApplicationRecord
  self.table_name = 'analytics_events'

  # ── Scopes ───────────────────────────────────────────────────────────
  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :by_event, ->(name) { where(event_name: name) }
  scope :by_city, ->(city) { where(city: city) }
  scope :by_vertical, ->(v) { where(vertical: v) }
  scope :by_date, ->(date) { where(created_at: date.all_day) }
  scope :conversions, -> { where(event_name: %w[wizard_complete whatsapp_click lead_created]) }
  scope :with_utm, -> { where.not(utm_campaign: nil) }

  # ── Aggregations ─────────────────────────────────────────────────────
  def self.daily_funnel(days: 90)
    where(created_at: days.days.ago..).group('DATE(created_at)').pick(
      Arel.sql("
        COUNT(*) FILTER (WHERE event_name = 'wizard_start') as wizard_starts,
        COUNT(*) FILTER (WHERE event_name = 'roi_expand') as roi_expands,
        COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as wizard_completions,
        COUNT(*) FILTER (WHERE event_name = 'lead_created') as leads_created
      ")
    )
  end

  def self.top_cities(limit: 10, days: 30)
    where(created_at: days.days.ago..)
      .where.not(city: nil)
      .group(:city, :state, :vertical)
      .select(
        'city', 'state', 'vertical',
        Arel.sql('COUNT(DISTINCT user_session_id) as sessions'),
        Arel.sql("COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as completions"),
        Arel.sql("COUNT(*) FILTER (WHERE event_name = 'lead_created') as leads")
      )
      .order(Arel.sql("COUNT(*) FILTER (WHERE event_name = 'lead_created') DESC"))
      .limit(limit)
  end

  def self.conversion_rate(days: 30)
    events = where(created_at: days.days.ago..)
    starts = events.where(event_name: 'wizard_start').count
    completions = events.where(event_name: 'wizard_complete').count
    leads = events.where(event_name: 'lead_created').count

    {
      starts: starts,
      completions: completions,
      leads: leads,
      roi_expand_rate: starts.positive? ? (events.where(event_name: 'roi_expand').count.to_f / starts * 100).round(1) : 0,
      completion_rate: starts.positive? ? (completions.to_f / starts * 100).round(1) : 0,
      lead_creation_rate: completions.positive? ? (leads.to_f / completions * 100).round(1) : 0,
      overall_conversion_rate: starts.positive? ? (leads.to_f / starts * 100).round(2) : 0
    }
  end
end
