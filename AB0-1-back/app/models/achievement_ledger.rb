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

  scope :recent, -> { order(created_at: :desc) }
end
