class Article < ApplicationRecord
  include SeoStandardizable
  extend FriendlyId

  friendly_id :title, use: :slugged

  belongs_to :category
  belongs_to :product, optional: true
  belongs_to :author, class_name: 'AdminUser'

  # Companies relationship (Many-to-Many)
  has_and_belongs_to_many :companies

  has_one_attached :banner

  before_validation :normalize_and_sanitize_content
  after_commit :schedule_frontend_revalidation, on: %i[create update destroy]

  validates :title, presence: true
  validates :category, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :content, presence: true, if: -> { status == 'published' }
  validates :published_at, presence: true, if: -> { status == 'published' }
  validate :banner_mime_type, if: -> { banner.attached? }
  validate :banner_file_size, if: -> { banner.attached? }
  validate :banner_dimensions, if: -> { banner.attached? }
  validates :status, inclusion: { in: %w[draft published], message: '%{value} is not a valid status' }, allow_nil: true
  
  validates :author, presence: true
  validates :banner, presence: { message: 'deve ser anexado para publicação' }, if: -> { status == 'published' }
  validate :validate_published_banner_dimensions, if: -> { status == 'published' && banner.attached? }
  validate :validate_published_title_length, if: -> { status == 'published' }
  validate :validate_published_description_length, if: -> { status == 'published' }
  validate :validate_published_content_headings, if: -> { status == 'published' }

  # Defaults
  after_initialize :set_defaults, if: :new_record?

  scope :published, -> { where(status: 'published').where('articles.published_at <= ?', Time.current) }
  scope :featured, -> { where(featured: true) }
  scope :sponsored, -> { where(sponsored: true) }

  def sponsored?
    sponsored
  end

  def should_generate_new_friendly_id?
    title_changed?
  end

  def schedule_frontend_revalidation
    slugs = [previous_changes.dig('slug', 0), slug].compact.uniq
    return if slugs.empty?

    ArticleRevalidationJob.perform_later(slugs)
  rescue StandardError => e
    Rails.logger.error("[Article] Failed to enqueue frontend revalidation: #{e.message} article_id=#{id}")
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id content created_at id product_id title updated_at sponsored sponsored_label slug status featured
       views_count published_at author_id seo_title seo_description meta_title meta_description seo_keywords]
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

    # Só valida dimensões se os metadados já existem (analyze já foi executado).
    # Não chamamos banner.analyze() aqui pois isso faz I/O externo (download do S3)
    # durante a validação — antes do commit — causando ActiveStorage::FileNotFoundError.
    # O analyze é disparado de forma assíncrona via after_create_commit/after_update_commit.
    width = banner.metadata[:width]
    height = banner.metadata[:height]
    return unless width && height

    min_w = 200
    min_h = 200
    errors.add(:banner, "deve ter no mínimo #{min_w}x#{min_h}px") if width < min_w || height < min_h
  end

  def normalize_and_sanitize_content
    return if content.blank?

    self.content = Articles::ContentSanitizer.call(content)
  end

  def validate_published_banner_dimensions
    return unless banner.variable?
    width = banner.metadata[:width]
    height = banner.metadata[:height]
    return unless width && height

    if width < 1200 || height < 630
      errors.add(:banner, "deve ter no mínimo 1200x630px para publicação (atual: #{width}x#{height}px)")
    end
  end

  def validate_published_title_length
    if title.blank?
      errors.add(:title, "não pode ficar em branco")
    elsif title.length > 60
      errors.add(:title, "deve ter no máximo 60 caracteres para publicação (atual: #{title.length})")
    end
  end

  def validate_published_description_length
    desc = seo_description.presence || meta_description.presence || excerpt.presence
    if desc.blank?
      errors.add(:seo_description, "deve ser preenchido para publicação")
    elsif desc.length > 160
      errors.add(:seo_description, "deve ter no máximo 160 caracteres para publicação (atual: #{desc.length})")
    end
  end

  def validate_published_content_headings
    if content.blank?
      errors.add(:content, "não pode ficar vazio")
    elsif !content.match?(/(<h2>|<h2\s)/i)
      errors.add(:content, "deve conter pelo menos um cabeçalho H2 (<h2>) para organização e SEO")
    end
  end
end
