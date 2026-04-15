# frozen_string_literal: true

class LeadWizardFieldOption < ApplicationRecord
  belongs_to :lead_wizard_field, inverse_of: :lead_wizard_field_options, touch: true

  validates :label, presence: true
  validates :value, presence: true, uniqueness: { scope: :lead_wizard_field_id }
  validates :position, numericality: { greater_than_or_equal_to: 0 }

  before_validation :normalize_fields

  def self.ransackable_attributes(_auth_object = nil)
    %w[id lead_wizard_field_id label value position created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[lead_wizard_field]
  end

  private

  def normalize_fields
    self.label = label.to_s.strip
    self.value = value.to_s.strip
    self.position = 0 if position.nil?
  end
end
