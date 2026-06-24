class ConversationEvent < ApplicationRecord
  EVENT_TYPES = %w[
    conversation.started
    conversation.updated
    conversation.resolved
    conversation.reopened
    conversation.blocked
    conversation.reported
    message.created
    message.read
    typing.started
    typing.stopped
  ].freeze

  belongs_to :conversation
  belongs_to :actor, class_name: 'User', optional: true

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
end
