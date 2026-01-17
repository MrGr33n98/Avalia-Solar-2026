module Moderation
  extend ActiveSupport::Concern

  included do
    # Ensure the model has the necessary columns
    # moderation_status: string/enum
    # approved_at: datetime
    # approved_by_admin_user_id: integer
    # rejected_reason: text

    enum moderation_status: {
      draft: 'draft',
      pending_review: 'pending_review',
      approved: 'approved',
      rejected: 'rejected',
      suspended: 'suspended'
    }, _default: :draft, _prefix: :moderation

    scope :pending_review, -> { where(moderation_status: :pending_review) }
    scope :approved, -> { where(moderation_status: :approved) }
    scope :rejected, -> { where(moderation_status: :rejected) }
    scope :suspended, -> { where(moderation_status: :suspended) }

    belongs_to :approved_by, class_name: 'AdminUser', foreign_key: 'approved_by_admin_user_id', optional: true
  end

  def submit_for_review!
    update(moderation_status: :pending_review, submitted_at: Time.current)
  end

  def approve!(admin_user)
    update(
      moderation_status: :approved,
      approved_by: admin_user,
      approved_at: Time.current,
      rejected_reason: nil
    )
    # Trigger notifications here if needed
  end

  def reject!(admin_user, reason)
    update(
      moderation_status: :rejected,
      approved_by: admin_user,
      approved_at: Time.current,
      rejected_reason: reason
    )
    # Trigger notifications here if needed
  end

  def suspend!(admin_user, reason)
    update(
      moderation_status: :suspended,
      approved_by: admin_user,
      approved_at: Time.current,
      rejected_reason: reason
    )
  end
end
