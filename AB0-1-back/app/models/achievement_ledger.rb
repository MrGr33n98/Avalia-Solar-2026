# frozen_string_literal: true

class AchievementLedger < ApplicationRecord
  self.table_name = 'achievement_ledger'

  KINDS = %w[unlocked revoked reinstated manual_grant manual_revoke].freeze

  belongs_to :user
  belongs_to :achievement_badge
  belongs_to :admin_user, optional: true

  validates :user_id, presence: true
  validates :achievement_badge_id, presence: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :xp_delta, presence: true, numericality: { only_integer: true }
  validates :idempotency_key, presence: true, uniqueness: true

  alias_attribute :points_delta, :xp_delta

  scope :recent, -> { order(created_at: :desc) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[achievement_badge_id admin_user_id created_at id idempotency_key kind reason updated_at user_id xp_delta]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[achievement_badge admin_user user]
  end
end
