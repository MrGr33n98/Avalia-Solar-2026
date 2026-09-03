# frozen_string_literal: true

module Sales
  class OpportunityContact < ApplicationRecord
    self.table_name = 'sales_opportunity_contacts'

    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id

    ROLES = %w[decision_maker champion economic_buyer approver influencer technical_evaluator].freeze

    validates :role, inclusion: { in: ROLES }
  end
end
