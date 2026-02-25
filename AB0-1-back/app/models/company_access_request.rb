class CompanyAccessRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :user
  belongs_to :company
  belongs_to :reviewed_by_admin_user, class_name: 'AdminUser', optional: true

  has_many_attached :documents

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
  after_create_commit :notify_slack_new_request
  after_update_commit :handle_approval, if: :saved_change_to_approved?

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

  def saved_change_to_approved?
    saved_change_to_status? && approved?
  end

  def handle_approval
    create_company_member
    verify_company
    notify_slack_approval
  end

  def create_company_member
    CompanyMember.find_or_create_by!(
      company: company,
      user: user
    ) do |member|
      member.role = :owner
      member.status = :active
    end
  end

  def verify_company
    return if company.verified?

    company.update!(
      verified: true,
      moderation_status: 'active',
      approved_at: Time.current,
      approved_by_admin_user_id: reviewed_by_admin_user_id
    )
  end

  def notify_slack_new_request
    SlackNotificationService.notify_company_access_request(self)
  end

  def notify_slack_approval
    SlackNotificationService.notify_company_access_approved(self)
  end
end
