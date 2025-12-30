# frozen_string_literal: true

class AnalyticsEvent < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :event_type, presence: true
  validates :tracked_at, presence: true

  scope :for_company, ->(company_id) { where(company_id: company_id) if company_id.present? }
  scope :in_range, ->(from_time, to_time) { where(tracked_at: from_time..to_time) }
end
