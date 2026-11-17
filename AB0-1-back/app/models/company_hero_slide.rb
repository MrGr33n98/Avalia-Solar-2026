# frozen_string_literal: true

class CompanyHeroSlide < ApplicationRecord
  STATUSES = %w[draft pending_review approved published rejected archived].freeze
  ALLOWED_TYPES = %w[image/png image/jpeg image/webp].freeze
  MAX_BYTES = 5.megabytes

  belongs_to :company
  has_one_attached :image

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id slot display_position revision status created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end

  scope :published, -> { where(status: 'published').order(:display_position, :id) }
  scope :editable, -> { where(status: %w[draft rejected]) }

  validates :slot, :display_position, inclusion: { in: 1..3 }
  validates :revision, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validates :alt_text, length: { maximum: 160 }
  validates :image_width, :image_height, numericality: { only_integer: true, greater_than: 0 },
                                         allow_nil: true
  validates :image_bytes, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_BYTES },
                          allow_nil: true
  validate :validate_image_attachment

  after_commit :revalidate_public_profile, if: :saved_change_to_status?

  def aspect_ratio
    return nil if image_width.to_i <= 0 || image_height.to_i <= 0

    image_width.to_f / image_height
  end

  def ready_for_publication?
    image.attached? && image_width.to_i >= 800 && image_height.to_i >= 200 &&
      image_bytes.to_i.between?(1, MAX_BYTES) && ALLOWED_TYPES.include?(image_format)
  end

  private

  def validate_image_attachment
    return unless image.attached?

    blob = image.blob
    errors.add(:image, 'deve ser PNG, JPG ou WebP') unless ALLOWED_TYPES.include?(blob.content_type)
    errors.add(:image, 'deve ter no máximo 5 MB') if blob.byte_size > MAX_BYTES
  end

  def revalidate_public_profile
    return unless saved_change_to_status&.include?('published')

    PublicProfileRevalidationJob.perform_later(company_id)
  rescue StandardError => e
    Rails.logger.error("[BrandHero] profile revalidation company=#{company_id}: #{e.class}: #{e.message}")
  end
end
