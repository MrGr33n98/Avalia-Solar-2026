# frozen_string_literal: true

class GroupMembership < ApplicationRecord
  ROLES = %w[member moderator admin owner].freeze
  STATUSES = %w[pending active rejected left banned].freeze
  NOTIFICATION_LEVELS = %w[all highlights mentions off].freeze

  belongs_to :group, inverse_of: :group_memberships
  belongs_to :user
  belongs_to :approved_by, class_name: 'User', optional: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[approved_at approved_by_id created_at group_id id joined_at notifications_level role status updated_at user_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[approved_by group user]
  end

  validates :role, inclusion: { in: ROLES }
  validates :status, inclusion: { in: STATUSES }
  validates :notifications_level, inclusion: { in: NOTIFICATION_LEVELS }
  validates :user_id, uniqueness: { scope: :group_id }

  scope :active, -> { where(status: 'active') }
  scope :pending, -> { where(status: 'pending') }
  scope :moderators, -> { where(role: %w[moderator admin owner], status: 'active') }

  def active?
    status == 'active'
  end

  def pending?
    status == 'pending'
  end

end