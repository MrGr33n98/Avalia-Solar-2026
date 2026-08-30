# frozen_string_literal: true

class ChatMessage < ApplicationRecord
  belongs_to :chat_session
  belongs_to :sender, class_name: 'User', optional: true

  has_many_attached :attachments

  validates :role, presence: true, inclusion: { in: %w[user assistant agent system] }
  validates :content, presence: true
  validates :client_message_id, uniqueness: { scope: :chat_session_id }, allow_blank: true

  scope :by_role, ->(r) { where(role: r) }
  scope :user_messages, -> { where(role: 'user') }
  scope :assistant_messages, -> { where(role: 'assistant') }
  scope :agent_messages, -> { where(role: 'agent') }
  scope :chronological, -> { order(created_at: :asc, id: :asc) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id chat_session_id role content model token_count
      latency_ms safety_status intent_detected feedback
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[chat_session]
  end
end
