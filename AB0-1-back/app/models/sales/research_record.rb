# frozen_string_literal: true

module Sales
  class ResearchRecord < ApplicationRecord
    self.table_name = 'sales_research_records'

    CERTAINTIES = %w[known inferred unknown unverified].freeze

    belongs_to :company
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :created_by, class_name: 'User', optional: true

    validates :kind, :source, :collected_at, presence: true
    validates :certainty, inclusion: { in: CERTAINTIES }
    validate :content_is_object
    validates :confidence, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }, allow_nil: true

    private

    def content_is_object
      errors.add(:content, 'deve ser um objeto') unless content.is_a?(Hash)
    end
  end
end
