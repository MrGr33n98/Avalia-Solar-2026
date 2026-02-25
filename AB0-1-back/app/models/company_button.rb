class CompanyButton < ApplicationRecord
  belongs_to :company, touch: true

  validates :label, presence: true
  validates :url, presence: true
  validates :button_type,
            inclusion: { in: %w[primary secondary whatsapp custom], message: '%{value} is not a valid button type' }
  validate :validate_url_scheme

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc) }

  private

  def validate_url_scheme
    return if url.blank?

    uri = URI.parse(url)
    scheme = uri.scheme.to_s.downcase

    if %w[javascript data].include?(scheme)
      errors.add(:url, 'esquema inválido')
      return
    end

    unless %w[http https].include?(scheme)
      errors.add(:url, 'deve ser uma URL http/https válida')
      return
    end

    if uri.host.to_s.strip.empty?
      errors.add(:url, 'deve ser uma URL http/https válida')
      nil
    end

    # Permite hosts customizados para WhatsApp para manter compatibilidade.
  rescue URI::InvalidURIError
    errors.add(:url, 'must be a valid URL')
  end
end
