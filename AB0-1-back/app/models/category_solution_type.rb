class CategorySolutionType < ApplicationRecord
  belongs_to :category

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc, name: :asc) }

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :category_id }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :validate_structured_json

  private

  def validate_structured_json
    errors.add(:attributes_json, 'deve ser um objeto JSON') unless attributes_json.is_a?(Hash)
    errors.add(:use_cases, 'deve ser uma lista JSON') unless use_cases.is_a?(Array)
  end
end
