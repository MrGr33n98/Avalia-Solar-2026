class BillingAuditLog < ApplicationRecord
  belongs_to :user
  belongs_to :company

  enum action: {
    checkout_initiated: 0,
    portal_opened: 1,
    enterprise_lead_created: 2,
    subscription_synced: 3
  }
end
