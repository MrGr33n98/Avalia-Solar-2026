# frozen_string_literal: true

class LeadWizardSection < ApplicationRecord
  belongs_to :lead_wizard_version, inverse_of: :lead_wizard_sections, touch: true
  has_many :lead_wizard_fields, dependent: :destroy, inverse_of: :lead_wizard_section

  validates :key, presence: true, uniqueness: { scope: :lead_wizard_version_id }
  validates :title, presence: true
  validates :position, numericality: { greater_than_or_equal_to: 0 }

  before_validation :normalize_fields

  def self.ransackable_attributes(_auth_object = nil)
    %w[id lead_wizard_version_id key title description position created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[lead_wizard_version lead_wizard_fields]
  end

  private

  def normalize_fields
    self.key = key.to_s.strip
    self.position = 0 if position.nil?
  end
end
