# frozen_string_literal: true

class GroupRule < ApplicationRecord
  belongs_to :group, inverse_of: :group_rules

  def self.ransackable_attributes(_auth_object = nil)
    %w[active created_at description group_id id position title updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[group]
  end

  validates :title, presence: true, length: { maximum: 120 }
  validates :description, presence: true, length: { maximum: 1000 }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true).order(position: :asc, id: :asc) }
end