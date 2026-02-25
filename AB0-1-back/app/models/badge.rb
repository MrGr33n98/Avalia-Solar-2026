class Badge < ApplicationRecord
  include Rails.application.routes.url_helpers

  ALLOWED_IMAGE_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
  MAX_IMAGE_SIZE = 2.megabytes

  has_one_attached :image
  
  has_many :company_badges, dependent: :destroy
  has_many :companies, through: :company_badges

  validates :name, presence: true
  validates :public_slug, presence: true, uniqueness: true
  validate :image_constraints

  scope :active, -> { where(active: true) }

  before_validation :generate_slug, on: :create

  def self.ransackable_attributes(_auth_object = nil)
    %w[category_label created_at description id name position updated_at year edition active public_slug]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies company_badges image_attachment image_blob]
  end

  def image_url
    return nil unless image.attached?

    begin
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
      
      Rails.application.routes.url_helpers.rails_storage_proxy_url(image, options)
    rescue => e
      Rails.logger.error("Error generating image URL for badge #{id}: #{e.message}")
      nil
    end
  end

  private

  def generate_slug
    return if public_slug.present?
    self.public_slug = "#{name.parameterize}-#{SecureRandom.hex(4)}"
  end

  def image_constraints
    return unless image.attached?

    if image.blob.byte_size > MAX_IMAGE_SIZE
      errors.add(:image, "deve ter no máximo 2MB")
    end

    unless ALLOWED_IMAGE_TYPES.include?(image.blob.content_type)
      errors.add(:image, "deve ser PNG, JPG, JPEG ou WEBP")
    end
  end
end
