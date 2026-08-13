class ReviewerSolution < ApplicationRecord
  belongs_to :user
  has_many :events, class_name: 'ReviewerSolutionEvent', dependent: :restrict_with_exception

  STATUSES = %w[active rejected disabled].freeze

  TYPES = %w[company product service technology].freeze

  validates :name, :category, presence: true
  validates :solution_type, inclusion: { in: TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :name, uniqueness: { scope: :user_id }

  def as_json(_options = {})
    { id: id.to_s, name: name, type: solution_type, category: category, verified: verified, status: status, companyId: company_id, created_at: created_at.iso8601 }
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id user_id name solution_type category verified status company_id created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user events]
  end
end
