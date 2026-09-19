# frozen_string_literal: true

module Sales
  class FounderInboxItem < ApplicationRecord
    self.table_name = 'sales_founder_inbox_items'

    STATUSES = %w[open acknowledged resolved dismissed].freeze
    RISK_TIERS = %w[r0 r1 r2 r3 r4].freeze

    belongs_to :company
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :mcp_approval_request, optional: true

    validates :kind, :title, :why, :recommended_action, :dedupe_key, :observed_at, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :risk_tier, inclusion: { in: RISK_TIERS }

    scope :active, -> { where(status: %w[open acknowledged]) }
    scope :needs_approval, -> { active.where(approval_required: true) }

    def resolve!
      update!(status: 'resolved', resolved_at: Time.current)
    end

    def self.upsert_open!(company:, dedupe_key:, attributes:)
      item = find_or_initialize_by(company: company, dedupe_key: dedupe_key)
      item.assign_attributes(attributes.merge(status: 'open', resolved_at: nil))
      item.save!
      item
    end
  end
end
