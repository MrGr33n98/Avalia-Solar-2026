class SeoLandingPage < ApplicationRecord
  belongs_to :category

  before_validation :normalize_local_fields

  validates :slug, presence: true, uniqueness: true
  validates :city_name, :state_abbr, presence: true

  # Cache de metadados para acesso rápido no Next.js
  # Estrutura esperada: { solar_radiation: float, estimated_roi: float, top_companies: [] }
  def self.find_by_slug!(slug)
    find_by!(slug: slug)
  end

  def self.local_solar_slug(state, city)
    state_slug = Locations::CoverageNormalizer.state_slug(state)
    city_slug = Locations::CoverageNormalizer.city_slug(city)
    "energia-solar-#{state_slug}-#{city_slug}"
  end

  def self.local_solar_category
    Category.find_by(seo_url: 'energia-solar') ||
      Category.where('LOWER(name) = ?', 'energia solar').first ||
      Category.active.order(:name).first ||
      Category.order(:name).first
  end

  def self.ensure_brazil_capital_solar_pages!
    category = local_solar_category
    return [] unless category

    Locations::CoverageNormalizer::BRAZIL_CAPITALS.map do |capital|
      slug = local_solar_slug(capital[:state], capital[:city])
      page = find_or_initialize_by(slug: slug)
      metadata = (page.metadata_cache || {}).merge(
        'published' => true,
        'source' => 'admin_capitals',
        'city_slug' => Locations::CoverageNormalizer.city_slug(capital[:city]),
        'local_route' => Locations::CoverageNormalizer.local_solar_path(capital[:state], capital[:city])
      )

      page.update!(
        category: category,
        city_name: capital[:city],
        state_abbr: capital[:state],
        metadata_cache: metadata
      )
      page
    end
  end

  def local_solar_path
    Locations::CoverageNormalizer.local_solar_path(state_abbr, city_name)
  end

  private

  def normalize_local_fields
    self.state_abbr = Locations::CoverageNormalizer.normalize_state(state_abbr) || state_abbr.to_s.strip.upcase
    canonical_city = Locations::CoverageNormalizer.normalize_city(city_name, state: state_abbr)
    self.city_name = canonical_city if canonical_city.present?
    self.slug = self.class.local_solar_slug(state_abbr, city_name) if slug.blank? && state_abbr.present? && city_name.present?
    self.metadata_cache = (metadata_cache || {}).merge('local_route' => local_solar_path) if state_abbr.present? && city_name.present?
  end
end
