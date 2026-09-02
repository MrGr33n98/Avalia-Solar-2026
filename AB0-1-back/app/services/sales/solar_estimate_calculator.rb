module Sales
  class SolarEstimateCalculator
    # Estimativa determinística; valores comerciais finais exigem vistoria e proposta.
    def self.call(monthly_consumption_kwh:, peak_sun_hours:, performance_ratio: 0.8,
                  tariff_brl_per_kwh:, system_cost_brl_per_kwp: 4200)
      consumption = monthly_consumption_kwh.to_f
      hours = peak_sun_hours.to_f
      ratio = performance_ratio.to_f
      tariff = tariff_brl_per_kwh.to_f
      raise ArgumentError, 'consumo e irradiância devem ser maiores que zero' if consumption <= 0 || hours <= 0
      raise ArgumentError, 'performance_ratio deve estar entre 0 e 1' unless ratio.positive? && ratio <= 1

      system_kwp = (consumption / (hours * 30 * ratio)).round(3)
      monthly_savings = (consumption * tariff).round(2)
      investment = (system_kwp * system_cost_brl_per_kwp.to_f).round(2)
      { system_kwp: system_kwp, estimated_generation_kwh: (system_kwp * hours * 30 * ratio).round(2),
        monthly_savings_brl: monthly_savings, estimated_cost_brl: investment,
        payback_months: investment.positive? ? (investment / monthly_savings).round(1) : 0 }
    end
  end
end
