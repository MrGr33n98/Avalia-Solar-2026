class VoiceReviewTranscript < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session
  belongs_to :voice_review_asset

  before_validation :ensure_id
  validates :provider, :model_id, :private_raw_text, presence: true

  def text
    structured_data['clean_comment'].presence || private_raw_text
  end

  def structured_data
    has_attribute?(:structured_payload) && structured_payload.is_a?(Hash) ? structured_payload : {}
  end

  def headline
    structured_data['headline'].presence
  end

  def inferred_rating
    value = structured_data['inferred_rating'].to_i
    value.between?(1, 5) ? value : nil
  end

  def inferred_criteria
    Array(structured_data['inferred_criteria'])
  end

  def mentioned_equipment
    Array(structured_data['mentioned_equipment'])
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
