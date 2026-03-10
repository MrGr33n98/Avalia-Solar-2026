class GatedDownload < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true

  validates :document_type, presence: true
  validates :contact_email, presence: true, format: URI::MailTo::EMAIL_REGEXP

  scope :recent, -> { order(created_at: :desc) }
  scope :by_document, ->(type) { where(document_type: type) }

  after_create :trigger_intent_calculation
  after_create :trigger_identity_stitching

  private

  def trigger_intent_calculation
    CalculateBuyerIntentJob.perform_later(
      company_id,
      lead_id: user_id,
      anonymous_id: anonymous_id
    )
  end

  def trigger_identity_stitching
    return if user_id.blank? || anonymous_id.blank?

    StitchIdentityJob.perform_later(user_id, anonymous_id)
  end
end
