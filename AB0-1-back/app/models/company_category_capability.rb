class CompanyCategoryCapability < ApplicationRecord
  CAPABILITY_TYPES = %w[installation maintenance project_engineering equipment_supply monitoring software financing].freeze

  belongs_to :company
  belongs_to :category
  belongs_to :category_solution_type, optional: true

  validates :capability_type, inclusion: { in: CAPABILITY_TYPES }
  validate :attributes_json_must_be_an_object

  scope :verified, -> { where(verified: true) }

  private

  def attributes_json_must_be_an_object
    errors.add(:attributes_json, 'deve ser um objeto JSON') unless attributes_json.is_a?(Hash)
  end
end
