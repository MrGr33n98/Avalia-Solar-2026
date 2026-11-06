# frozen_string_literal: true

class CategorySlugRedirect < ApplicationRecord
  VALID_SLUG_REGEX = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
  ALLOWED_HTTP_STATUSES = [301, 308].freeze

  belongs_to :category, inverse_of: :slug_redirects

  before_validation :normalize_source_slug

  validates :source_slug,
            presence: true,
            uniqueness: { case_sensitive: false },
            length: { maximum: 160 },
            format: { with: VALID_SLUG_REGEX }
  validates :http_status, inclusion: { in: ALLOWED_HTTP_STATUSES }
  validate :source_slug_must_not_match_any_category_seo_url

  # Resolve slug antigo em 1 hop direto para a categoria ativa atual
  def self.resolve(raw_slug)
    return nil unless table_exists?

    slug = raw_slug.to_s.strip.downcase
    return nil if slug.blank? || !slug.match?(VALID_SLUG_REGEX)

    record = includes(:category).find_by(source_slug: slug)
    return nil unless record&.category

    target = record.category
    return nil unless target.status == 'active'
    return nil if target.seo_url.blank? || target.seo_url == slug

    target
  end

  private

  def normalize_source_slug
    self.source_slug = source_slug.to_s.strip.downcase if source_slug.present?
  end

  def source_slug_must_not_match_any_category_seo_url
    return if source_slug.blank?

    if category && category.seo_url.to_s.strip.downcase == source_slug
      errors.add(:source_slug, 'não pode ser igual ao seo_url atual da própria categoria (loop)')
      return
    end

    if Category.where('LOWER(seo_url) = ?', source_slug).exists?
      errors.add(:source_slug, 'já está em uso como seo_url ativo de uma categoria')
    end
  end
end

