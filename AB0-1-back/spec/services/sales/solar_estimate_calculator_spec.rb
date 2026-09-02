require 'rails_helper'

RSpec.describe Sales::SolarEstimateCalculator do
  it 'dimensiona sistema e calcula payback de forma determinística' do
    result = described_class.call(monthly_consumption_kwh: 900, peak_sun_hours: 5,
                                  tariff_brl_per_kwh: 0.95)

    expect(result[:system_kwp]).to eq(7.5)
    expect(result[:estimated_generation_kwh]).to eq(900.0)
    expect(result[:monthly_savings_brl]).to eq(855.0)
  end

  it 'rejeita consumo inválido' do
    expect do
      described_class.call(monthly_consumption_kwh: 0, peak_sun_hours: 5, tariff_brl_per_kwh: 1)
    end.to raise_error(ArgumentError)
  end
end
