# frozen_string_literal: true

class CompanyAiAuditEvent < ApplicationRecord
  belongs_to :company
  belongs_to :company_ai_assistant
  validates :action, presence: true
  validate :owner_matches_tenant

  private

  def owner_matches_tenant
    return if company_ai_assistant.nil? || company_ai_assistant.company_id == company_id

    errors.add(:company_id, 'does not match assistant owner')
  end
end
