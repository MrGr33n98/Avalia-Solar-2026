class CompanyService < ApplicationRecord
  belongs_to :company
  belongs_to :category

  enum status: { active: 'active', inactive: 'inactive' }, _suffix: true

  has_many_attached :images

  # Avaliações exclusivamente atribuídas a este serviço (sem confundir com as da empresa).
  has_many :service_reviews, -> { where(reviewable_type: 'CompanyService') },
           class_name: 'Review', foreign_key: :reviewable_id, inverse_of: false

  validate :validate_video_links

  validates :name, :slug, presence: true
  validates :slug, uniqueness: { scope: :company_id }
  validates :price_from, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :visible, -> { active_status }

  private

  def validate_video_links
    links = video_links
    unless links.is_a?(Array) && links.length <= 8
      errors.add(:video_links, 'permite no máximo oito links')
      return
    end

    links.each do |url|
      uri = URI.parse(url.to_s)
      host = uri.host.to_s.downcase
      allowed_hosts = %w[youtube.com www.youtube.com youtu.be vimeo.com www.vimeo.com player.vimeo.com]
      unless uri.scheme == 'https' && allowed_hosts.include?(host) && uri.userinfo.nil?
        errors.add(:video_links, 'aceita apenas links HTTPS do YouTube ou Vimeo')
      end
    rescue URI::InvalidURIError
      errors.add(:video_links, 'contém URL inválida')
    end
  end


end
