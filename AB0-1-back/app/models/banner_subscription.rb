class BannerSubscription < ApplicationRecord
  belongs_to :company
  belongs_to :banner_offer

  STATUSES = %w[pending_payment active past_due canceled expired failed].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: 'active') }

  def active?
    status == 'active'
  end

  def activate!(starts_at: Time.current, ends_at: nil)
    update!(
      status: 'active',
      activated_at: Time.current,
      starts_at: starts_at,
      ends_at: ends_at
    )
  end

  def cancel!(reason: nil)
    update!(status: 'canceled', canceled_at: Time.current, failure_reason: reason)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id banner_offer_id status provider checkout_session_id payment_reference starts_at ends_at activated_at canceled_at created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company banner_offer]
  end
end
