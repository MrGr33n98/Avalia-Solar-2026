class CategoryLeadWizard < ApplicationRecord
  belongs_to :category

  validates :category_id, presence: true, uniqueness: true
  validates :template_key, presence: true
  validate :validate_schema_format

  def self.ransackable_attributes(_auth_object = nil)
    %w[id category_id enabled template_key template_version created_at updated_at]
  end

  private

  def validate_schema_format
    return if schema.is_a?(Hash)

    errors.add(:schema, 'must be a valid JSON object')
  end
end
