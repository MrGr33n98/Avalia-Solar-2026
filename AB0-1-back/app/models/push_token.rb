class PushToken < ApplicationRecord
  PLATFORMS = %w[ios android web expo].freeze

  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: PLATFORMS }

  scope :active, -> { where(active: true) }
end
