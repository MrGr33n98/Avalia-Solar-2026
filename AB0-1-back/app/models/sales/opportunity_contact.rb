module Sales
  class OpportunityContact < ApplicationRecord
    self.table_name = 'sales_opportunity_contacts'

    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id

    ROLES = %w[
      decision_maker
      economic_buyer
      champion
      influencer
      technical_evaluator
      approver
      legal
      procurement
      user
      gatekeeper
      unknown
    ].freeze

    INFLUENCE_LEVELS = %w[low medium high].freeze
    SUPPORT_LEVELS = %w[blocker negative neutral positive champion].freeze

    validates :role, inclusion: { in: ROLES }
    validates :influence, inclusion: { in: INFLUENCE_LEVELS }
    validates :support_level, inclusion: { in: SUPPORT_LEVELS }
    validates :sales_opportunity_id, uniqueness: { scope: :sales_contact_id }

    after_save :sync_opportunity_primary_contact, if: :is_primary?

    private

    def sync_opportunity_primary_contact
      opportunity.update_column(:primary_contact_id, sales_contact_id)
    end
  end
end
