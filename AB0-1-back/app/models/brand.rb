# frozen_string_literal: true

class Brand < ApplicationRecord
  LOGO_MAX_SIZE = 2.megabytes
  ALLOWED_LOGO_CONTENT_TYPES = %w[image/png image/jpeg image/webp].freeze
  STATUSES = %w[active disabled archived].freeze

  has_one_attached :logo
  has_many :products, dependent: :nullify
  has_many :analytics_events, dependent: :nullify
  has_many :reviewer_brand_usages, dependent: :restrict_with_error
  has_many :reviewer_solutions, dependent: :nullify

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { case_sensitive: false }
  validates :status, inclusion: { in: STATUSES }
  validate :validate_logo_attachment, if: -> { logo.attached? }
  validate :validate_aliases_format

  before_validation :generate_slug, if: -> { slug.blank? && name.present? }
  before_validation :normalize_attributes

  scope :active, -> { where(status: 'active') }
  scope :with_attached_logo, -> { includes(logo_attachment: :blob) }

  scope :search_by_query, ->(q) {
    return all if q.blank?

    sanitized = q.to_s.strip.downcase
    pattern = "%#{sanitized.gsub('%', '\\%').gsub('_', '\\_')}%"
    where(
      "LOWER(brands.name) LIKE :pattern OR LOWER(brands.slug) LIKE :pattern OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(brands.aliases, '[]'::jsonb)) AS a WHERE LOWER(a) LIKE :pattern
      )",
      pattern: pattern
    ).order(
      Arel.sql(
        sanitize_sql_array([
          "CASE WHEN LOWER(brands.name) = :exact THEN 0 " \
          "WHEN LOWER(brands.name) LIKE :starts_with THEN 1 " \
          "ELSE 2 END, brands.name ASC",
          exact: sanitized,
          starts_with: "#{sanitized}%"
        ])
      )
    )
  }

  def self.find_by_value(value)
    return nil if value.blank?

    if value.to_s.match?(/\A\d+\z/)
      find_by(id: value.to_i)
    else
      find_by(slug: value.to_s.downcase)
    end
  end

  def initials
    parts = name.to_s.strip.split(/\s+/).reject(&:blank?)
    return 'SO' if parts.empty?
    return parts.first[0, 2].upcase if parts.length == 1

    "#{parts.first[0]}#{parts.last[0]}".upcase
  end

  def logo_url
    return nil unless logo.attached?

    if Rails.application.routes.default_url_options[:host].present?
      Rails.application.routes.url_helpers.rails_storage_proxy_url(logo)
    else
      fallback_host = ENV['ACTIVE_STORAGE_HOST'].presence || ENV['APP_HOST'].presence ||
                      (Rails.env.test? ? 'http://www.example.com' : 'https://api.avaliasolar.com.br')
      Rails.application.routes.url_helpers.rails_storage_proxy_url(logo, host: fallback_host)
    end
  rescue StandardError => e
    Rails.logger.warn("[Brand] Falha ao gerar logo_url id=#{id}: #{e.message}")
    nil
  end

  def logo_alt
    name
  end

  def as_catalog_json
    {
      id: id,
      name: name,
      slug: slug,
      logo_url: logo_url,
      logo_alt: logo_alt,
      initials: initials,
      status: status
    }
  end

  private

  def normalize_attributes
    self.name = name.to_s.strip if name.present?
    self.slug = slug.to_s.strip.downcase if slug.present?
    self.status = status.presence || 'active'
    if aliases.is_a?(Array)
      self.aliases = aliases.map { |a| a.to_s.strip }.reject(&:blank?).uniq
    end
  end

  def generate_slug
    self.slug = name.to_s.parameterize
  end

  def validate_aliases_format
    return if aliases.nil? || aliases.is_a?(Array)

    errors.add(:aliases, 'deve ser uma lista de nomes alternativos')
  end

  def validate_logo_attachment
    return unless logo.attached?

    blob = logo.blob
    return unless blob

    content_type = blob.content_type.to_s.downcase
    unless ALLOWED_LOGO_CONTENT_TYPES.include?(content_type)
      errors.add(:logo, 'deve ser PNG, JPG ou WEBP')
    end

    if blob.byte_size.to_i > LOGO_MAX_SIZE
      errors.add(:logo, 'tamanho máximo é 2MB')
    end

    if blob.analyzed? && blob.metadata.present?
      width = blob.metadata['width'].to_i
      height = blob.metadata['height'].to_i
      if width > 2048 || height > 2048
        errors.add(:logo, 'dimensões máximas permitidas são 2048x2048px')
      end
    end
  rescue StandardError => e
    Rails.logger.warn("[Brand] Erro ao validar anexo de logo: #{e.message}")
    errors.add(:logo, 'arquivo inválido ou corrompido')
  end
end
