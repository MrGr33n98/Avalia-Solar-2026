class CompanyServiceArea < ApplicationRecord
  COVERAGE_TYPES = %w[city state national radius].freeze

  belongs_to :company

  before_validation :normalize_state_code

  validates :coverage_type, presence: true, inclusion: { in: COVERAGE_TYPES }
  validates :state_code, presence: true, unless: :national_coverage?
  validates :city_name, presence: true, if: :city_coverage?
  validates :radius_km, presence: true, numericality: { greater_than: 0 }, if: :radius_coverage?

  scope :active, -> { where(is_active: true) }

  def covers?(city:, state:)
    return false unless is_active?
    return true if national_coverage?

    target_state = state.to_s.strip.upcase
    target_city = city.to_s.strip.downcase

    return false if target_state.present? && state_code != target_state

    case coverage_type
    when 'state'
      state_code == target_state
    when 'city'
      state_code == target_state && city_name.to_s.strip.downcase == target_city
    when 'radius'
      state_code == target_state
    else
      false
    end
  end

  def national_coverage?
    coverage_type == 'national'
  end

  def state_coverage?
    coverage_type == 'state'
  end

  def city_coverage?
    coverage_type == 'city'
  end

  def radius_coverage?
    coverage_type == 'radius'
  end

  private

  def normalize_state_code
    self.state_code = state_code.to_s.strip.upcase.presence if state_code.present?
  end
end
