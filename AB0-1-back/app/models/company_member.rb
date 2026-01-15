class CompanyMember < ApplicationRecord
  has_paper_trail

  belongs_to :company
  belongs_to :user
  enum role: { owner: 0, manager: 1, editor: 2 }, _default: :editor
  validates :company_id, :user_id, presence: true
  validates :role, inclusion: { in: roles.keys }
  validates :user_id, uniqueness: { scope: :company_id }

  def self.ransackable_associations(auth_object = nil)
    ["company", "user", "versions"]
  end

  def self.ransackable_attributes(auth_object = nil)
    ["company_id", "created_at", "id", "role", "updated_at", "user_id"]
  end
end
