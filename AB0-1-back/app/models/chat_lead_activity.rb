# frozen_string_literal: true

class ChatLeadActivity < ApplicationRecord
  belongs_to :chat_lead

  validates :activity_type, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id chat_lead_id activity_type old_status new_status performed_by_id created_at]
  end
end
