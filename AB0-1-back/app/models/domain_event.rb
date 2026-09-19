# frozen_string_literal: true

class DomainEvent < ApplicationRecord
  STATUSES = %w[pending processing completed published failed].freeze

  before_validation :set_default_status
  before_validation :ensure_event_envelope

  validates :event_type, presence: true
  validates :aggregate_type, presence: true
  validates :aggregate_id, presence: true
  validates :occurred_at, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: 'pending').order(occurred_at: :asc) }
  scope :published, -> { where(status: %w[completed published]).order(processed_at: :desc) }
  scope :retryable, -> { where(status: 'failed').where('attempts < ?', 5).order(occurred_at: :asc) }
  scope :dead_letter, -> { where(status: 'failed').where('attempts >= ?', 5).order(occurred_at: :asc) }

  scope :processable, lambda {
    pending_relation = where(status: 'pending')
    failed_relation = where(status: 'failed').where('attempts < ?', 5)
    pending_relation.or(failed_relation).order(occurred_at: :asc)
  }

  def processable?
    status == 'pending' || (status == 'failed' && attempts < 5)
  end

  def event_id
    payload['event_id'] || payload[:event_id] || id.to_s
  end

  def event_version
    (payload['event_version'] || payload[:event_version] || 1).to_i
  end

  def company_id
    payload['company_id'] || payload[:company_id]
  end

  def metadata
    payload['metadata'] || payload[:metadata] || {}
  end

  def correlation_id
    payload['correlation_id'] || payload[:correlation_id]
  end

  def causation_id
    payload['causation_id'] || payload[:causation_id]
  end

  def available_at
    ts = payload['available_at'] || payload[:available_at]
    ts ? Time.zone.parse(ts.to_s) : occurred_at
  end

  def mark_processing!
    update!(status: 'processing')
  end

  def mark_published!
    update!(status: 'completed', processed_at: Time.current)
  end

  def mark_failed!(error)
    err_text = error.is_a?(Exception) ? "#{error.class}: #{error.message}\n#{error.backtrace&.first(5)&.join("\n")}" : error.to_s
    update!(
      status: 'failed',
      attempts: attempts + 1,
      last_error: err_text
    )
  end

  private

  def set_default_status
    self.status ||= 'pending'
    self.occurred_at ||= Time.current
  end

  def ensure_event_envelope
    self.payload ||= {}
    self.payload['event_id'] ||= SecureRandom.uuid
    self.payload['event_version'] ||= 1
  end
end
