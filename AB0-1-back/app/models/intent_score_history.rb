# == Schema Information
#
# Table name: intent_score_histories
#
class IntentScoreHistory < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :intent_score

  # Validations
  validates :score_before, presence: true, numericality: { only_integer: true }
  validates :score_after, presence: true, numericality: { only_integer: true }
  validates :level_before, presence: true
  validates :level_after, presence: true

  # Scopes
  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :level_changes, -> { where.not('level_before = level_after') }
  scope :score_increases, -> { where('score_after > score_before') }
  scope :score_decreases, -> { where('score_after < score_before') }

  # Score Delta
  def score_delta
    score_after - score_before
  end

  def score_increased?
    score_delta.positive?
  end

  def score_decreased?
    score_delta.negative?
  end

  def level_changed?
    level_before != level_after
  end

  def level_upgraded?
    level_score(level_after) > level_score(level_before)
  end

  private

  def level_score(level)
    { 'cold' => 1, 'warm' => 2, 'hot' => 3, 'boiling' => 4, 'immediate' => 5, 'declared' => 6 }[level] || 0
  end
end
