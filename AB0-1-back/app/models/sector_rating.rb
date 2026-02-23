class SectorRating < ApplicationRecord
  belongs_to :company
  belongs_to :user

  enum status: { draft: 'draft', published: 'published', archived: 'archived' }

  WEIGHTS = {
    homologation: 2.0,
    technical_quality: 2.0,
    safety: 1.0,
    consultancy: 1.0
  }.freeze

  validates :homologation, :technical_quality, :safety, :consultancy,
            presence: true,
            inclusion: { in: 1..5 }
  validates :company_id, :user_id, presence: true
  validates :user_id, uniqueness: { scope: :company_id }

  before_validation :downcase_status
  before_save :calculate_total_score
  after_commit :refresh_company_sector_rating
  after_destroy :refresh_company_sector_rating

  scope :published, -> { where(status: statuses[:published]) }

  def average_score
    total_score.to_f.round(1)
  end

  private

  def calculate_total_score
    weighted_sum = WEIGHTS.sum { |attr, weight| public_send(attr).to_f * weight }
    total_weight = WEIGHTS.values.sum
    self.total_score = (weighted_sum / total_weight).round(1)
  end

  def downcase_status
    self.status = status.to_s.downcase
  end

  def refresh_company_sector_rating
    company&.recalculate_sector_rating_cache!
  end
end
