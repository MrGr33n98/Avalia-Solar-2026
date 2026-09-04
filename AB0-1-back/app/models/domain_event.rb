# frozen_string_literal: true

class DomainEvent < ApplicationRecord
  STATUSES = %w[pending processing completed failed].freeze

  before_validation :set_default_status

  validates :event_type, presence: true
  validates :aggregate_type, presence: true
  validates :aggregate_id, presence: true
  validates :occurred_at, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: 'pending').order(occurred_at: :asc) }
  scope :retryable, -> { where(status: 'failed').where('attempts < ?', 5).order(occurred_at: :asc) }

  scope :processable, lambda {
    pending_relation = where(status: 'pending')
    failed_relation = where(status: 'failed').where('attempts < ?', 5)
    pending_relation.or(failed_relation).order(occurred_at: :asc)
  }

  def processable?
    status == 'pending' || (status == 'failed' && attempts < 5)
  end

  private

  def set_default_status
    self.status ||= 'pending'
  end
end
