class ConversationReport < ApplicationRecord
  STATUSES = %w[open reviewing dismissed actioned].freeze
  REASONS = %w[spam abuse fraud inappropriate other].freeze

  belongs_to :conversation
  belongs_to :reporter, class_name: 'User'

  validates :reason, presence: true, inclusion: { in: REASONS }
  validates :status, inclusion: { in: STATUSES }
end
