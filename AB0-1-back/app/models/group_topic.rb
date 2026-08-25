# frozen_string_literal: true

class GroupTopic < ApplicationRecord
  belongs_to :group, inverse_of: :group_topics
  has_many :group_posts, dependent: :nullify

  def self.ransackable_attributes(_auth_object = nil)
    %w[active created_at group_id id name position slug updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[group]
  end

  validates :name, presence: true, length: { maximum: 80 }
  validates :slug, presence: true, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :slug, uniqueness: { scope: :group_id }
  validates :description, length: { maximum: 500 }, allow_blank: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true).order(position: :asc, id: :asc) }

  before_validation :normalize_slug

  private

  def normalize_slug
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
  end
end