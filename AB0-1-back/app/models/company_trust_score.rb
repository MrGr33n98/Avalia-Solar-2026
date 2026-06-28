# frozen_string_literal: true

class CompanyTrustScore < ApplicationRecord
  self.table_name = 'company_trust_score'
  self.primary_key = 'company_id'

  belongs_to :company

  # Validations
  validates :score, presence: true,
                    numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :company_id, presence: true, uniqueness: true

  # Scopes
  scope :high_trust, -> { where('score >= 80') }
  scope :low_trust, -> { where('score < 50') }
  scope :by_score, -> { order(score: :desc) }

  def health_status
    case score
    when 0..40 then 'critical'
    when 41..60 then 'poor'
    when 61..75 then 'fair'
    when 76..90 then 'good'
    else 'excellent'
    end
  end

  def score_trend
    # Logic to compare with previous history if implemented
    'stable'
  end
end
