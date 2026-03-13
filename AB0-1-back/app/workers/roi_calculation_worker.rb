class RoiCalculationWorker
  include Sidekiq::Job

  sidekiq_options queue: 'default'

  def perform(lead_id)
    lead = Lead.find_by(id: lead_id)
    return unless lead

    Rails.logger.info "[RoiCalculationWorker] Calculating ROI for lead #{lead_id}"

    # 1. Fetch Tariff (from cache or stub)
    tariff = fetch_tariff(lead.zipcode)

    # 2. Stub Solar Radiation # kWh/m2/day (placeholder)

    # 3. Calculate ROI
    # ROI = (Annual Savings / Total Investment) * 100
    # Payback = Total Investment / Annual Savings

    # Placeholder logic for now (to be refined by Data Engineer)
    # Annual Savings = monthly_kwh * tariff * 12
    # Total Investment = estimated_budget (from lead)

    monthly_kwh = lead.monthly_kwh.to_f
    monthly_kwh = 300.0 if monthly_kwh <= 0 # Default if not provided

    annual_savings = monthly_kwh * tariff * 12

    # total_investment uses the safe accessor from Lead model
    total_investment = lead.estimated_budget.to_f
    total_investment = 15_000.0 if total_investment <= 0

    roi = (annual_savings / total_investment) * 100
    payback_years = total_investment / annual_savings
    total_savings_25yr = annual_savings * 25

    # 4. Update lead.attribution_json
    attribution = lead.attribution_json || {}
    attribution['roi'] = roi.round(2)
    attribution['payback_years'] = payback_years.round(1)
    attribution['total_savings_25yr'] = total_savings_25yr.round(2)

    lead.update_column(:attribution_json, attribution)

    # Trigger LeadScoringWorker (now handled by EventDispatcher)
  end

  private

  def fetch_tariff(zipcode)
    return 0.75 if zipcode.blank?

    prefix = zipcode.to_s[0..4]
    cache = ExternalTariffsCache.find_by(cep_prefix: prefix)
    return cache.tariff_kwh.to_f if cache

    0.75 # Fallback tariff
  end
end
