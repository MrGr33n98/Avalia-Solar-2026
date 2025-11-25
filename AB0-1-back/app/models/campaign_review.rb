class CampaignReview < ApplicationRecord
  belongs_to :campaign
  belongs_to :user, optional: true
  belongs_to :product, optional: true
  belongs_to :company, optional: true

  enum status: {
    draft: 'draft',
    active: 'active',
    finished: 'finished',
    canceled: 'canceled'
  }, _suffix: true

  scope :sponsored, -> { where(sponsored: true) }

  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validate :end_after_start

  def self.ransackable_attributes(_auth_object = nil)
    %w[campaign_id company_id comment created_at id product_id rating updated_at user_id sponsored status start_at end_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[campaign product company user]
  end

  private

  def end_after_start
    return if start_at.blank? || end_at.blank?
    errors.add(:end_at, 'deve ser maior ou igual a start_at') if end_at < start_at
  end
end
