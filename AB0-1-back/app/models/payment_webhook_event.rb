class PaymentWebhookEvent < ApplicationRecord
  validates :provider, presence: true
  validates :provider_event_id, presence: true, uniqueness: { scope: :provider }
  validates :event_type, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending processed failed] }

  def processed!
    update!(status: 'processed')
  end

  def failed!(error)
    update!(status: 'failed', error_message: error)
  end
end
