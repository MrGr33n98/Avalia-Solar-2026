class SeoLandingPage < ApplicationRecord
  belongs_to :category

  validates :slug, presence: true, uniqueness: true
  validates :city_name, :state_abbr, presence: true

  # Cache de metadados para acesso rápido no Next.js
  # Estrutura esperada: { solar_radiation: float, estimated_roi: float, top_companies: [] }
  def self.find_by_slug!(slug)
    find_by!(slug: slug)
  end
end
