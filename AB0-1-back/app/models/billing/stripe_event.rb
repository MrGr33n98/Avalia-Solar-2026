module Billing
  class StripeEvent < ApplicationRecord
    self.table_name = 'billing_stripe_events'

    validates :stripe_event_id, presence: true, uniqueness: true
    validates :event_type, presence: true
    validates :processing_status, presence: true, inclusion: { in: %w[processing success failed skipped] }
    validates :processed_at, presence: true

    scope :failed, -> { where(processing_status: 'failed') }
    scope :success, -> { where(processing_status: 'success') }
  end
end
