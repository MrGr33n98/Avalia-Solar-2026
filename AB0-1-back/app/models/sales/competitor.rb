# frozen_string_literal: true

module Sales
  class Competitor < ApplicationRecord
    self.table_name = 'sales_competitors'

    has_many :opportunity_competitors, class_name: 'Sales::OpportunityCompetitor', foreign_key: :sales_competitor_id, dependent: :destroy
    has_many :opportunities, through: :opportunity_competitors, source: :opportunity

    validates :name, presence: true
    validates :normalized_name, presence: true, uniqueness: true

    before_validation :normalize_name

    scope :active, -> { where(active: true) }

    private

    def normalize_name
      self.normalized_name = name.to_s.downcase.strip if name.present?
    end
  end
end
