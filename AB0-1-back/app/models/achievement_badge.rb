# frozen_string_literal: true

class AchievementBadge < ApplicationRecord
  CATEGORIES = %w[review profile solution community engagement].freeze
  TIERS = %w[bronze silver gold special].freeze
  ACTIONS = %w[write_review edit_profile add_solution vote_review view].freeze

  has_many :user_achievements, dependent: :destroy
  has_many :users, through: :user_achievements
  has_many :achievement_ledgers, dependent: :restrict_with_error

  validates :slug, presence: true, uniqueness: true
  validates :name, presence: true
  validates :description, presence: true
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :tier, presence: true, inclusion: { in: TIERS }
  validates :points_xp, numericality: { greater_than_or_equal_to: 0 }
  validates :threshold, numericality: { greater_than: 0 }
  validates :action_enum, presence: true, inclusion: { in: ACTIONS }
  validates :earned_asset_path, presence: true
  validates :locked_asset_path, presence: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  def to_param
    slug
  end
end
