class CreatorLead < ApplicationRecord
  belongs_to :creator_user, class_name: 'User'
  belongs_to :publication, class_name: 'ReviewerPublication', optional: true
  belongs_to :visitor, class_name: 'User', optional: true

  INTENTS = %w[contact_creator download_material request_help request_quote].freeze
  STATUSES = %w[new contacted qualified converted lost].freeze
  validates :name, :email, :consent_at, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :intent, inclusion: { in: INTENTS }
  validates :status, inclusion: { in: STATUSES }
  scope :recent, -> { order(created_at: :desc) }
  scope :open, -> { where.not(status: %w[converted lost]) }
  after_create_commit :enqueue_notification

  private

  def enqueue_notification
    CreatorLeadNotificationJob.perform_later(id)
  rescue StandardError => e
    Rails.logger.error("[CreatorLead] notification enqueue failed lead_id=#{id} error=#{e.class}")
  end
end
