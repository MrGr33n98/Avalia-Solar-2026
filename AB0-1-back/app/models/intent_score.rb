# == Schema Information
#
# Table name: intent_scores
#
class IntentScore < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :company
  belongs_to :lead, class_name: 'User', foreign_key: 'lead_id', optional: true
  has_many :histories, class_name: 'IntentScoreHistory', foreign_key: 'intent_score_id', dependent: :destroy

  # Validations
  validates :total_score, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :intent_level, presence: true, inclusion: { in: %w[cold warm hot boiling immediate declared] }
  validates :company_id, presence: true
  validate :must_have_lead_or_anonymous_id

  # Callbacks
  before_save :calculate_intent_level
  after_save :record_history, if: :saved_change_to_total_score?

  # Scopes
  scope :cold, -> { where(intent_level: 'cold') }
  scope :warm, -> { where(intent_level: 'warm') }
  scope :hot, -> { where(intent_level: 'hot') }
  scope :boiling, -> { where(intent_level: 'boiling') }
  scope :immediate, -> { where(intent_level: 'immediate') }
  scope :declared, -> { where(intent_level: 'declared') }
  scope :actionable, -> { where(intent_level: %w[hot boiling immediate declared]) }
  scope :stale, -> { where('last_interaction_at < ?', 24.hours.ago) }
  scope :recent, -> { where('last_interaction_at >= ?', 24.hours.ago) }
  scope :by_score, -> { order(total_score: :desc) }

  # Level Checkers
  def cold? = intent_level == 'cold'
  def warm? = intent_level == 'warm'
  def hot? = intent_level == 'hot'
  def boiling? = intent_level == 'boiling'
  def immediate? = intent_level == 'immediate'
  def declared? = intent_level == 'declared'
  def actionable? = %w[hot boiling immediate declared].include?(intent_level)

  # Recommend Action
  def recommended_action
    case intent_level
    when 'cold' then 'nurture'
    when 'warm' then 'follow_up'
    when 'hot' then 'call_today'
    when 'boiling' then 'call_now'
    when 'immediate' then 'emergency_contact'
    when 'declared' then 'close_deal'
    end
  end

  # SLA (Service Level Agreement)
  def sla_window
    case intent_level
    when 'cold' then '7-30 dias'
    when 'warm' then '48-72h'
    when 'hot' then '24h'
    when 'boiling' then '2-4h'
    when 'immediate' then '15min'
    when 'declared' then 'Imediato'
    end
  end

  # Thermometer Emoji
  def thermometer_emoji
    case intent_level
    when 'cold' then '🧊'
    when 'warm' then '🌤️'
    when 'hot' then '🔥'
    when 'boiling' then '🌋'
    when 'immediate' then '🚨'
    when 'declared' then '🎯'
    end
  end

  private

  def must_have_lead_or_anonymous_id
    if lead_id.blank? && anonymous_id.blank?
      errors.add(:base, 'Must have either lead_id or anonymous_id')
    end
  end

  def calculate_intent_level
    self.intent_level = case total_score
                        when 0..30 then 'cold'
                        when 31..50 then 'warm'
                        when 51..70 then 'hot'
                        when 71..85 then 'boiling'
                        when 86..95 then 'immediate'
                        when 96..100 then 'declared'
                        else 'cold'
                        end
  end

  def record_history
    histories.create!(
      score_before: total_score_before_last_save || 0,
      score_after: total_score,
      level_before: intent_level_before_last_save || 'cold',
      level_after: intent_level,
      change_reason: 'recalculation',
      score_breakdown: score_breakdown,
      triggered_by: 'system'
    )
  end
end
