class ExternalTariffsCache < ApplicationRecord
  validates :cep_prefix, presence: true, uniqueness: true
  validates :tariff_kwh, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
