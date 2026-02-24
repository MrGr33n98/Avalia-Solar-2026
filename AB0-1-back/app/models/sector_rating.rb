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

  store_accessor :answers

  validates :company_id, :user_id, presence: true
  validates :user_id, uniqueness: { scope: :company_id }
  validate :validate_payload

  before_validation :downcase_status
  before_save :calculate_total_score
  after_commit :refresh_company_sector_rating
  after_destroy :refresh_company_sector_rating

  scope :published, -> { where(status: statuses[:published]) }

  def average_score
    total_score.to_f.round(1)
  end

  private

  def custom_answers?
    answers.present? && answers.is_a?(Hash) && answers.any?
  end

  def validate_payload
    if custom_answers?
      answers.each do |_, value|
        val = value.to_i
        errors.add(:answers, 'precisa conter valores entre 1 e 5') unless val.between?(1, 5)
      end
    else
      WEIGHTS.keys.each do |attr|
        val = public_send(attr)
        errors.add(attr, 'não pode ficar em branco') if val.nil?
        errors.add(attr, 'deve ser entre 1 e 5') unless val.to_i.between?(1, 5)
      end
    end
  end

  def calculate_total_score
    if custom_answers? && company.present?
      question_ids = answers.keys.map { |k| k.to_s.sub('question_', '').to_i }.presence ||
                     answers.keys.map(&:to_i)
      scoped_questions = company.company_sector_questions.where(id: question_ids)
      total_weight = scoped_questions.sum(:weight)
      if total_weight.positive?
        weighted_sum = scoped_questions.sum do |q|
          val = answers[q.id] || answers["question_#{q.id}"] || answers[q.id.to_s]
          val.to_f * q.weight
        end
        self.total_score = (weighted_sum / total_weight).round(1)
      end
    else
      weighted_sum = WEIGHTS.sum { |attr, weight| public_send(attr).to_f * weight }
      total_weight = WEIGHTS.values.sum
      self.total_score = (weighted_sum / total_weight).round(1)
    end
  end

  def downcase_status
    self.status = status.to_s.downcase
  end

  def refresh_company_sector_rating
    company&.recalculate_sector_rating_cache!
  end
end
