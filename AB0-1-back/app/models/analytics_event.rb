# frozen_string_literal: true

class AnalyticsEvent < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :event_id, presence: true, uniqueness: true
  validates :event_type, presence: true
  validates :tracked_at, presence: true

  scope :for_company, ->(company_id) { where(company_id: company_id) if company_id.present? }
  scope :in_range, ->(from_time, to_time) { where(tracked_at: from_time..to_time) }
  scope :by_type, ->(type) { where(event_type: type) }
  scope :recent, -> { order(tracked_at: :desc) }

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[event_type event_id company_id user_id tracked_at created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user]
  end

  # Aggregate by event type
  def self.count_by_type(start_date: 30.days.ago, end_date: Time.current)
    in_range(start_date, end_date)
      .group(:event_type)
      .count
  end

  # Daily counts for a company
  def self.daily_counts_for_company(company_id, days: 30)
    for_company(company_id)
      .in_range(days.days.ago, Time.current)
      .group('DATE(tracked_at)')
      .count
  end
end
