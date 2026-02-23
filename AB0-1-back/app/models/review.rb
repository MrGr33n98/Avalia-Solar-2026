class Review < ApplicationRecord
  include ReviewCallbacks

  belongs_to :company
  belongs_to :user
  has_many :review_decision_logs, dependent: :destroy

  MAX_FEATURED_PER_COMPANY = 5

  enum status: { pending: 0, approved: 1, rejected: 2, in_analysis: 3 }

  scope :approved_only, -> { where(status: statuses[:approved]) }
  scope :featured_only, -> { where(featured: true) }
  scope :for_company, ->(company_id) { where(company_id: company_id) if company_id.present? }
  scope :for_social_proof, -> { approved_only.featured_only.order(display_order: :asc, created_at: :desc) }

  after_commit :track_analytics_event, on: :create
  after_commit :notify_slack, on: :create
  after_commit :invalidate_social_proof_cache
  after_update_commit :notify_user_of_reply, if: :saved_change_to_reply?

  validates :rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :comment, presence: true, length: { minimum: 10 }
  validates :display_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :validate_featured_requires_paid_plan
  validate :validate_featured_limit_per_company
  validate :validate_featured_requires_approved_status

  # Update ransackable attributes to include comment
  def self.ransackable_attributes(_auth_object = nil)
    %w[comment created_at display_order featured id company_id rating status updated_at user_id verified]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user]
  end

  def self.social_proof_cache_key(company_id, limit: nil)
    suffix = limit.present? ? "limit/#{limit}" : '*'
    "social_proof/company/#{company_id}/#{suffix}"
  end

  def self.invalidate_social_proof_cache_for_company(company_id)
    return if company_id.blank?

    Rails.cache.delete_matched(social_proof_cache_key(company_id))
  rescue StandardError => e
    Rails.logger.warn("[Review] failed to invalidate social proof cache for company=#{company_id}: #{e.message}")
  end

  def public_reviewer_name
    raw_name = user&.name.to_s.strip
    return 'Cliente' if raw_name.blank?
    return raw_name if user_consented_to_full_name?

    anonymize_name(raw_name)
  end

  private

  def invalidate_social_proof_cache
    ids = [company_id, company_id_before_last_save].compact.uniq
    ids.each { |id| self.class.invalidate_social_proof_cache_for_company(id) }
  end

  def validate_featured_requires_paid_plan
    return unless featured?
    return if company&.can_use_social_proof?

    errors.add(:featured, 'is only available for companies with eligible paid plans')
  end

  def validate_featured_limit_per_company
    return unless featured?
    return if company_id.blank?

    featured_count = self.class.where(company_id: company_id, featured: true).where.not(id: id).count
    return if featured_count < MAX_FEATURED_PER_COMPANY

    errors.add(:featured, "limit reached (max #{MAX_FEATURED_PER_COMPANY})")
  end

  def validate_featured_requires_approved_status
    return unless featured?
    return if approved?

    errors.add(:featured, 'requires approved status')
  end

  def user_consented_to_full_name?
    return false unless user

    consent_fields = %i[
      public_name_consent
      display_full_name_consent
      review_name_consent
      lgpd_name_consent
      show_full_name
    ]

    consent_fields.any? do |field|
      user.respond_to?(field) && ActiveModel::Type::Boolean.new.cast(user.public_send(field))
    end
  end

  def anonymize_name(value)
    parts = value.split(/\s+/).reject(&:blank?)
    return value if parts.empty?
    return "#{parts.first[0].upcase}." if parts.length == 1

    "#{parts.first} #{parts.last[0].upcase}."
  end


  def track_analytics_event
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'review_created',
      metadata: {
        source: 'review',
        rating: rating
      },
      user: nil,
      tracked_at: created_at
    )
  rescue StandardError => e
    Rails.logger.warn("[Analytics] review tracking failed: #{e.message}")
  end

  def notify_slack
    SlackNotificationService.notify_review(self)
  end

  def notify_user_of_reply
    return if reply.blank?
    ReviewMailer.new_reply(self).deliver_later
  rescue StandardError => e
    Rails.logger.error("[ReviewMailer] Failed to enqueue reply email: #{e.message}")
  end
end
