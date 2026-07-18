class CompanyService < ApplicationRecord
  belongs_to :company
  belongs_to :category

  enum status: { active: 'active', inactive: 'inactive' }, _suffix: true

  validates :name, :slug, presence: true
  validates :slug, uniqueness: { scope: :company_id }
  validates :price_from, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :visible, -> { active_status }
end
