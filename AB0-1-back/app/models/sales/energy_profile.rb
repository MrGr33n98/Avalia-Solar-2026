module Sales
  class EnergyProfile < ApplicationRecord
    self.table_name = 'sales_energy_profiles'
    belongs_to :account, class_name: 'Sales::Account'
    validates :monthly_consumption_kwh, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  end
end
