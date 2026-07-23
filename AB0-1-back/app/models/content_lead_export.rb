# frozen_string_literal: true

class ContentLeadExport < ApplicationRecord
  belongs_to :company
  belongs_to :actor, class_name: 'User'

  validates :row_count, numericality: { greater_than_or_equal_to: 0 }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id actor_id row_count created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company actor]
  end
end
