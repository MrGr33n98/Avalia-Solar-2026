# frozen_string_literal: true

class Group < ApplicationRecord
  VISIBILITIES = %w[public private_visible private_hidden].freeze
  MEMBERSHIP_MODES = %w[open approval invite_only].freeze
  POSTING_MODES = %w[members moderated admins_only].freeze
  STATUSES = %w[draft active archived suspended].freeze

  belongs_to :owner, class_name: 'User'
  belongs_to :category, optional: true
  has_many :group_memberships, dependent: :destroy
  has_many :members, through: :group_memberships, source: :user
  has_many :group_topics, dependent: :destroy
  has_many :group_rules, dependent: :destroy
  has_many :group_posts, dependent: :restrict_with_error
  has_many :active_group_topics, -> { active }, class_name: 'GroupTopic', inverse_of: :group
  has_many :active_group_rules, -> { active }, class_name: 'GroupRule', inverse_of: :group

  def self.ransackable_attributes(_auth_object = nil)
    %w[created_at featured id name official owner_id slug status updated_at verified visibility]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category group_memberships members owner]
  end

  validates :name, presence: true, length: { maximum: 120 }
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :description, length: { maximum: 10_000 }, allow_blank: true
  validates :short_description, length: { maximum: 240 }, allow_blank: true
  validates :visibility, inclusion: { in: VISIBILITIES }
  validates :membership_mode, inclusion: { in: MEMBERSHIP_MODES }
  validates :posting_mode, inclusion: { in: POSTING_MODES }
  validates :status, inclusion: { in: STATUSES }

  scope :discoverable, -> { where(status: 'active', visibility: 'public') }
  scope :featured_groups, -> { discoverable.where(featured: true) }
  scope :newest, -> { order(created_at: :desc, id: :desc) }
  scope :most_active, -> { discoverable.order(posts_count: :desc, id: :desc) }

  def active_membership_for(user)
    return nil unless user

    group_memberships.find_by(user_id: user.id, status: 'active')
  end
end