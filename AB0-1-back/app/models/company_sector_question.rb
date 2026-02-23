class CompanySectorQuestion < ApplicationRecord
  belongs_to :company

  scope :active, -> { where(enabled: true).order(:order, :created_at) }

  validates :prompt, presence: true
  validates :weight, inclusion: { in: 1..5 }
  validates :order, presence: true

  before_validation :assign_default_order, on: :create

  def to_api_payload
    {
      id: id,
      prompt: prompt,
      weight: weight,
      enabled: enabled
    }
  end

  private

  def assign_default_order
    return if order.present?
    self.order = (company.company_sector_questions.maximum(:order) || 0) + 1
  end
end
