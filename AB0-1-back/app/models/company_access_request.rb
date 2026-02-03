class CompanyAccessRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :user
  belongs_to :company
  belongs_to :reviewed_by_admin_user, class_name: 'AdminUser', optional: true

  validates :status, inclusion: { in: STATUSES }
  validates :user_id, :company_id, presence: true
  validates :user_id, uniqueness: {
    scope: :company_id,
    conditions: -> { where(status: %w[pending approved]) },
    message: 'already has an active request'
  }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :rejected, -> { where(status: 'rejected') }

  before_validation :set_requested_at, on: :create

  def approved?
    status == 'approved'
  end

  def rejected?
    status == 'rejected'
  end

  def pending?
    status == 'pending'
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      admin_note company_id created_at id message requested_at reviewed_at
      reviewed_by_admin_user_id status updated_at user_id
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company reviewed_by_admin_user user]
  end

  private

  def set_requested_at
    self.requested_at ||= Time.current
  end
end
