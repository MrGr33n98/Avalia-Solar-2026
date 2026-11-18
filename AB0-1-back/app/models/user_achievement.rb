# frozen_string_literal: true

require 'securerandom'

class UserAchievement < ApplicationRecord
  STATES = %w[unlocked revoked].freeze

  belongs_to :user
  belongs_to :achievement_badge

  validates :user_id, presence: true
  validates :achievement_badge_id, presence: true, uniqueness: { scope: :user_id }
  validates :state, presence: true, inclusion: { in: STATES }
  validates :unlocked_at, presence: true
  validates :share_token, presence: true, uniqueness: true

  before_validation :ensure_defaults, on: :create

  scope :unlocked, -> { where(state: 'unlocked') }
  scope :revoked, -> { where(state: 'revoked') }

  def unlocked?
    state == 'unlocked'
  end

  def revoked?
    state == 'revoked'
  end

  def revoke!
    update!(state: 'revoked', revoked_at: Time.current)
  end

  def reinstate!
    update!(state: 'unlocked', revoked_at: nil)
  end

  private

  def ensure_defaults
    self.unlocked_at ||= Time.current
    self.state ||= 'unlocked'
    self.share_token ||= SecureRandom.urlsafe_base64(24)
  end
end
