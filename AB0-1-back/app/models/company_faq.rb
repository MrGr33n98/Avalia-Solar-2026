class CompanyFaq < ApplicationRecord
  belongs_to :company

  enum status: { draft: 'draft', published: 'published' }, _default: 'published'

  scope :ordered, -> { order(position: :asc, created_at: :asc) }
  scope :published_only, -> { where(status: 'published') }

  validates :question, presence: true
  validates :answer, presence: true
  validates :position, numericality: { only_integer: true }
  validates :status, inclusion: { in: statuses.keys }

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[answer company_id created_at id position question status updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end
end
