# frozen_string_literal: true

class ContentReport < ApplicationRecord
  REASONS = %w[spam off_topic harassment misinformation commercial_abuse other].freeze
  STATUSES = %w[open resolved dismissed].freeze

  belongs_to :reportable, polymorphic: true
  belongs_to :reporter, class_name: 'User'
  belongs_to :group, optional: true
  belongs_to :resolved_by, class_name: 'User', optional: true

  validates :reason, presence: true, inclusion: { in: REASONS }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :open_reports, -> { where(status: 'open') }
  scope :resolved, -> { where(status: 'resolved') }
  scope :dismissed, -> { where(status: 'dismissed') }

  def resolved?
    status == 'resolved'
  end

  def dismissed?
    status == 'dismissed'
  end
end
