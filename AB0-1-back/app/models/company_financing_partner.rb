class CompanyFinancingPartner < ApplicationRecord
  belongs_to :company, counter_cache: :financing_partners_count
  has_one_attached :logo

  scope :ordered, -> { order(position: :asc, priority: :asc, created_at: :asc) }
  scope :active, -> { where(active: true) }

  validates :name, presence: true
  validates :priority, numericality: { only_integer: true }
  validates :position, numericality: { only_integer: true }
  validate :logo_attached

  private

  def logo_attached
    errors.add(:logo, 'deve ser enviado') unless logo.attached?
  end

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    column_names
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company logo_attachment logo_blob]
  end
end
