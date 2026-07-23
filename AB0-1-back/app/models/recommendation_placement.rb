class RecommendationPlacement < ApplicationRecord
  PLACEMENT_TYPES = %w[sponsored pinned].freeze

  belongs_to :company
  belongs_to :category, optional: true

  before_validation :normalize_state_code

  validates :placement_type, presence: true, inclusion: { in: PLACEMENT_TYPES }
  validates :slot_position, presence: true, numericality: { greater_than: 0 }
  validates :starts_at, presence: true
  validates :ends_at, presence: true
  validate :ends_at_after_starts_at

  scope :active_now, ->(time = Time.current) {
    where(active: true)
      .where('starts_at <= ? AND ends_at >= ?', time, time)
  }
  scope :sponsored, -> { where(placement_type: 'sponsored') }
  scope :pinned, -> { where(placement_type: 'pinned') }

  def active_for?(time = Time.current)
    return false unless active?
    return false if time < starts_at || time > ends_at
    return false if max_impressions.present? && current_impressions >= max_impressions

    true
  end

  def expired?(time = Time.current)
    time > ends_at
  end

  private

  def normalize_state_code
    self.state_code = state_code.to_s.strip.upcase.presence if state_code.present?
  end

  def ends_at_after_starts_at
    return if starts_at.blank? || ends_at.blank?

    if ends_at <= starts_at
      errors.add(:ends_at, 'deve ser posterior à data de início (starts_at)')
    end
  end
end
