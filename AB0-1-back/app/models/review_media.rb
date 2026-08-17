# frozen_string_literal: true

class ReviewMedia < ApplicationRecord
  MAX_FILE_SIZE = 5.megabytes
  MAX_PER_REVIEW = 6
  MAX_TOTAL_SIZE = 25.megabytes
  ALLOWED_CONTENT_TYPES = %w[image/jpeg image/png image/webp].freeze
  MEDIA_TYPES = %w[image].freeze

  belongs_to :review, optional: true
  belongs_to :upload_session
  belongs_to :user
  belongs_to :moderated_by, polymorphic: true, optional: true
  has_one_attached :file

  enum status: {
    pending: 'pending',
    uploading: 'uploading',
    processing: 'processing',
    ready: 'ready',
    rejected: 'rejected',
    failed: 'failed'
  }, _default: :pending

  enum moderation_status: {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected'
  }, _prefix: :moderation

  validates :media_type, inclusion: { in: MEDIA_TYPES }
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: statuses.keys }
  validates :moderation_status, inclusion: { in: moderation_statuses.keys }
  validate :validate_file
  validate :validate_review_media_limit

  scope :publicly_ready, -> { where(status: :ready, moderation_status: %i[pending approved]) }
  scope :ordered, -> { order(sort_order: :asc, id: :asc) }

  before_validation :sync_file_metadata, if: :file_attached?
  validate :review_or_upload_session_present
  validate :user_matches_review
  validate :user_matches_upload_session

  def file_attached?
    file.attached?
  end

  private

  def sync_file_metadata
    self.content_type = file.blob.content_type
    self.byte_size = file.blob.byte_size
  end

  def validate_file
    return unless file_attached?

    unless ALLOWED_CONTENT_TYPES.include?(file.blob.content_type)
      errors.add(:file, 'deve ser JPG, PNG ou WebP')
    end

    return unless file.blob.byte_size > MAX_FILE_SIZE

    errors.add(:file, 'deve ter no máximo 5 MB')
  end

  def validate_review_media_limit
    return unless review
    return if persisted? && !review_id_changed?

    existing_count = review.review_media.where.not(id: id).count
    return if existing_count < MAX_PER_REVIEW

    errors.add(:base, 'uma avaliação pode ter no máximo 6 fotos')
  end

  def review_or_upload_session_present
    return if review_id.present? || upload_session.present?

    errors.add(:base, 'mídia deve pertencer a uma avaliação ou sessão de upload')
  end

  def user_matches_review
    return if review.blank? || review.user_id.blank? || review.user_id == user_id

    errors.add(:user, 'não corresponde ao autor da avaliação')
  end

  def user_matches_upload_session
    return if upload_session.blank? || upload_session.user_id == user_id

    errors.add(:user, 'não corresponde ao proprietário da sessão de upload')
  end

end