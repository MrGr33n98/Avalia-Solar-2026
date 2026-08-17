# frozen_string_literal: true

class ReviewUploadSession < ApplicationRecord
  EXPIRATION = 24.hours

  belongs_to :user
  has_many :review_media, dependent: :destroy

  enum status: {
    active: 'active',
    finalized: 'finalized',
    expired: 'expired',
    abandoned: 'abandoned'
  }

  before_validation :assign_uuid, on: :create

  validates :uuid, presence: true, uniqueness: true
  validates :status, inclusion: { in: statuses.keys }
  validates :expires_at, presence: true

  scope :available, -> { where(status: :active).where('expires_at > ?', Time.current) }

  def available?
    active? && expires_at > Time.current
  end

  private

  def assign_uuid
    self.uuid ||= SecureRandom.uuid
  end
end