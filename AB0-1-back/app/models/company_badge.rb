class CompanyBadge < ApplicationRecord
  belongs_to :company
  belongs_to :badge

  validates :company_id, uniqueness: { scope: :badge_id }
end
