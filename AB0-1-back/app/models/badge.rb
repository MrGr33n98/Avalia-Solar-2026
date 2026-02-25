class Badge < ApplicationRecord
  ALLOWED_BADGE_CONTENT_TYPES = %w[
    image/png
    image/jpeg
    image/jpg
    image/webp
    image/gif
    image/svg+xml
  ].freeze
  MAX_BADGE_IMAGE_SIZE = 5.megabytes

  # Add association to Category
  belongs_to :category, optional: true

  # Add Active Storage for badge image
  has_one_attached :badge_image
  validate :badge_image_constraints

  # Add ransackable attributes for ActiveAdmin
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at description id image name position
       updated_at year edition products]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category products badge_image_attachment badge_image_blob]
  end

  def image_url
    return nil unless badge_image.attached?

    begin
      options = Rails.application.routes.default_url_options.dup
      
      if Rails.env.development? && options[:host] == 'localhost'
        options[:port] = 3001
      end

      Rails.application.routes.url_helpers.rails_storage_proxy_url(badge_image, options)
    rescue => e
      Rails.logger.error("Error generating badge image URL for badge #{id}: #{e.message}")
      nil
    end
  end

  private

  def badge_image_constraints
    return unless badge_image.attached?

    blob = badge_image.blob
    content_type = blob.content_type.to_s

    unless ALLOWED_BADGE_CONTENT_TYPES.include?(content_type)
      errors.add(:badge_image, 'deve ser PNG, JPG, JPEG, WEBP, GIF ou SVG')
    end

    if blob.byte_size > MAX_BADGE_IMAGE_SIZE
      errors.add(:badge_image, 'deve ter no máximo 5MB')
    end
  end
end
