class Article < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: :slugged

  belongs_to :category
  belongs_to :product, optional: true
  belongs_to :author, class_name: 'AdminUser', optional: true
  
  # Companies relationship (Many-to-Many)
  has_and_belongs_to_many :companies

  has_one_attached :banner

  validates :title, presence: true
  validates :category, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :content, presence: true, if: -> { status == 'published' }
  validates :published_at, presence: true, if: -> { status == 'published' }
  validate :banner_mime_type, if: -> { banner.attached? }
  validate :banner_file_size, if: -> { banner.attached? }
  validate :banner_dimensions, if: -> { banner.attached? }
  validates :status, inclusion: { in: %w[draft published], message: "%{value} is not a valid status" }, allow_nil: true

  # Defaults
  after_initialize :set_defaults, if: :new_record?

  scope :published, -> { where(status: 'published').where('published_at <= ?', Time.current) }
  scope :featured, -> { where(featured: true) }
  scope :sponsored, -> { where(sponsored: true) }

  def sponsored?
    sponsored
  end

  def should_generate_new_friendly_id?
    title_changed?
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id content created_at id product_id title updated_at sponsored sponsored_label slug status featured views_count published_at author_id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category product companies author]
  end

  private

  def set_defaults
    self.sponsored ||= false
    self.featured ||= false
    self.views_count ||= 0
    self.status ||= 'draft'
  end

  def banner_mime_type
    allowed = %w[image/jpeg image/png image/gif]
    errors.add(:banner, 'precisa ser JPEG, PNG ou GIF') unless banner.blob.content_type.in?(allowed)
  end

  def banner_file_size
    max_bytes = 5.megabytes
    errors.add(:banner, 'excede o tamanho máximo de 5MB') if banner.blob.byte_size > max_bytes
  end

  def banner_dimensions
    return unless banner.variable?

    # Garante que os metadados foram analisados
    banner.analyze unless banner.metadata[:width].present?
    width = banner.metadata[:width]
    height = banner.metadata[:height]
    return unless width && height

    min_w = 200
    min_h = 200
    errors.add(:banner, "deve ter no mínimo #{min_w}x#{min_h}px") if width < min_w || height < min_h
  end
end
