class CompanyAccessRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :user
  belongs_to :company
  belongs_to :reviewed_by_admin_user, class_name: 'AdminUser', optional: true

  has_many_attached :documents

  validates :status, inclusion: { in: STATUSES }
  validates :user_id, :company_id, presence: true
  validates :contact_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :contact_phone, format: { with: /\A\+[1-9]\d{7,14}\z/ }, allow_blank: true
  validates :user_id, uniqueness: {
    scope: :company_id,
    conditions: -> { where(status: %w[pending approved]) },
    message: 'already has an active request'
  }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :rejected, -> { where(status: 'rejected') }

  before_validation :set_requested_at, on: :create
  before_validation :normalize_contact_details
  after_create_commit :notify_slack_new_request
  after_update :handle_approval, if: :saved_change_to_approved?
  after_update_commit :notify_slack_approval, if: :saved_change_to_approved?

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
      admin_note company_id contact_email contact_phone created_at id message requested_at reviewed_at
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

  def normalize_contact_details
    self.contact_email = contact_email.to_s.strip.downcase.presence
    return if contact_phone.blank?

    digits = contact_phone.to_s.gsub(/\D/, '')
    prefix = !contact_phone.to_s.strip.start_with?('+') && digits.length.in?([10, 11]) ? '55' : ''
    self.contact_phone = "+#{prefix}#{digits}"
  end

  def saved_change_to_approved?
    saved_change_to_status? && approved?
  end

  def handle_approval
    # Only a reviewed request can promote the previously pending registration.
    # Never change an existing person's password or mark their email as verified.
    user.update!(status: :active, approved_by_admin: true) if user.pending? && user.company_user?
    create_company_member
    verify_company
    user.send_confirmation_instructions if user.company_user? && !user.confirmed?
  end

  def create_company_member
    member = CompanyMember.find_or_initialize_by(
      company: company,
      user: user
    )
    member.update!(role: :owner, status: :active) unless member.owner? && member.active? && member.persisted?
  end

  def verify_company
    company.update!(
      active_admin: true,
      status: 'active',
      moderation_status: 'approved',
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
