module Billing
  class CompanySubscription < ApplicationRecord
    self.table_name = 'billing_company_subscriptions'

    belongs_to :company
    belongs_to :plan

    STATUSES = %w[
      trialing
      active
      past_due
      canceled
      unpaid
      incomplete
      incomplete_expired
      manual
      paused
      enterprise_lead
    ].freeze

    validates :status, presence: true, inclusion: { in: STATUSES }
    
    # Scopes
    scope :active_saas, -> { where(status: %w[active trialing past_due manual]) }
    scope :past_due, -> { where(status: 'past_due') }
    scope :enterprise_leads, -> { where(status: 'enterprise_lead') }

    def self.mrr_estimate
      active_saas.joins(:plan).sum('plans.price')
    end

    def active?
      %w[active trialing manual].include?(status)
    end

    def canceled?
      status == 'canceled'
    end

    def past_due?
      status == 'past_due'
    end

    def enterprise_lead?
      status == 'enterprise_lead'
    end

    def active_or_trialing?
      status.in?(%w[active trialing])
    end

    def has_stripe_subscription?
      stripe_subscription_id.present?
    end
  end
end
