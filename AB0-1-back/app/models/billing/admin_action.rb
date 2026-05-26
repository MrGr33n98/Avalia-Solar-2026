module Billing
  class AdminAction < ApplicationRecord
    self.table_name = 'billing_admin_actions'

    belongs_to :admin_user, optional: true
    belongs_to :company
    belongs_to :company_subscription, class_name: 'Billing::CompanySubscription', optional: true

    validates :action_type, presence: true
    validates :justification, presence: true
    validates :performed_at, presence: true

    ACTION_TYPES = %w[
      sync_stripe
      mark_enterprise
      force_downgrade
      cancel_at_period_end
      emergency_reset
      add_note
      extend_trial
      enterprise_lead_convert
    ].freeze

    validates :action_type, inclusion: { in: ACTION_TYPES }
  end
end
