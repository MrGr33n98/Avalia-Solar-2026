class CategoryFaq < ApplicationRecord
  belongs_to :category, touch: true

  enum status: { draft: 'draft', published: 'published' }, _default: 'published'

  scope :ordered, -> { order(position: :asc, created_at: :asc) }
  scope :published_only, -> { where(status: 'published') }

  validates :question, presence: true
  validates :answer, presence: true
  validates :position, numericality: { only_integer: true }
  validates :status, inclusion: { in: statuses.keys }

  # Ransack configuration for ActiveAdmin
  def self.ransackable_attributes(_auth_object = nil)
    %w[id category_id question answer status position created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category]
  end
end
