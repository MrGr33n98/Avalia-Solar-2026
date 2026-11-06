class CategorySolutionType < ApplicationRecord
  belongs_to :category, touch: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc, name: :asc) }

  before_validation :sanitize_structured_fields!

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :category_id }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :validate_structured_json

  private

  def sanitize_structured_fields!
    self.short_description = CategoryEditorialRevision.sanitize_html_string(short_description) if short_description.present?
    self.description = CategoryEditorialRevision.sanitize_html_string(description) if description.present?
    self.attributes_json = CategoryEditorialRevision.sanitize_value(attributes_json) if attributes_json.is_a?(Hash)
    self.use_cases = CategoryEditorialRevision.sanitize_value(use_cases) if use_cases.is_a?(Array)
  end

  def validate_structured_json
    errors.add(:attributes_json, 'deve ser um objeto JSON') unless attributes_json.is_a?(Hash)
    errors.add(:use_cases, 'deve ser uma lista JSON') unless use_cases.is_a?(Array)
  end
end
