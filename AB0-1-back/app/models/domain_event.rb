# frozen_string_literal: true

class DomainEvent < ApplicationRecord
  validates :event_type, presence: true
  validates :aggregate_type, presence: true
  validates :aggregate_id, presence: true
  validates :occurred_at, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending processing completed failed] }

  scope :pending, -> { where(status: 'pending').order(occurred_at: :asc) }
end
