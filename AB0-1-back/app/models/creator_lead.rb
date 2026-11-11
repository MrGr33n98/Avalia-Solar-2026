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
  STATUSES.each { |status_name| scope "status_#{status_name}", -> { where(status: status_name) } }
  after_create_commit :enqueue_notification

  def self.ransackable_attributes(_auth_object = nil)
    %w[admin_notes consent_at created_at creator_user_id email handled_at id intent name publication_id status updated_at visitor_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[creator_user publication visitor]
  end

  private

  def enqueue_notification
    CreatorLeadNotificationJob.perform_later(id)
  rescue StandardError => e
    Rails.logger.error("[CreatorLead] notification enqueue failed lead_id=#{id} error=#{e.class}")
  end
end
