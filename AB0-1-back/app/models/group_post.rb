# frozen_string_literal: true

class GroupPost < ApplicationRecord
  STATUSES = %w[published hidden removed].freeze

  belongs_to :group, inverse_of: :group_posts
  belongs_to :user, inverse_of: :group_posts
  belongs_to :group_topic, optional: true, inverse_of: :group_posts

  def self.ransackable_attributes(_auth_object = nil)
    %w[body created_at group_id group_topic_id id pinned status title updated_at user_id]
  end

  validates :body, presence: true, length: { maximum: 50_000 }
  validates :title, length: { maximum: 200 }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }
  validate :topic_belongs_to_group
  validate :topic_is_active

  scope :published, -> { where(status: 'published') }
  scope :visible, -> { where(status: 'published') }
  scope :recent, -> { order(pinned: :desc, created_at: :desc, id: :desc) }
  scope :oldest, -> { order(created_at: :asc, id: :asc) }

  def published?
    status == 'published'
  end

  private

  def topic_belongs_to_group
    return unless group_topic && group_topic.group_id != group_id

    errors.add(:group_topic, 'deve pertencer ao mesmo grupo')
  end

  def topic_is_active
    return unless group_topic && !group_topic.active?

    errors.add(:group_topic, 'deve estar ativo')
  end
end