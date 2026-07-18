class CompanyProduct < ApplicationRecord
  RELATIONSHIP_TYPES = %w[catalog_owner manufacturer distributor reseller installer authorized_partner].freeze

  belongs_to :company
  belongs_to :product
  has_many :product_offers, dependent: :destroy

  enum status: { active: 'active', inactive: 'inactive' }, _suffix: true

  validates :relationship_type, inclusion: { in: RELATIONSHIP_TYPES }
  validates :product_id, uniqueness: { scope: :company_id }

  scope :visible, -> { active_status }
end
