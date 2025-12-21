class LeadDistribution < ApplicationRecord
  belongs_to :lead
  belongs_to :company

  enum status: {
    queued: 'queued',
    sent: 'sent',
    failed: 'failed'
  }, _suffix: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[assigned_at company_id created_at id lead_id status updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company lead]
  end
end
