# frozen_string_literal: true

module Chat
  class CompanyIcpMatcherEngine
    def self.calculate_match(company:, lead_data:)
      new(company: company, lead_data: lead_data).calculate
    end

    def initialize(company:, lead_data:)
      @company = company
      @lead_data = lead_data || {}
    end

    def calculate
      profile = @company.company_icp_profile || CompanyIcpProfile.new

      score_financial = calculate_financial_score(profile)
      score_structure = calculate_structure_score(profile)
      score_geo       = calculate_geo_score(profile)
      score_urgency   = calculate_urgency_score

      weighted_score = (score_financial * 0.35) +
                       (score_structure * 0.25) +
                       (score_geo * 0.25) +
                       (score_urgency * 0.15)

      final_match = weighted_score.round(1)

      threshold = case profile.strictness_level
                  when 'strict' then 80.0
                  when 'flexible' then 50.0
                  else 70.0
                  end

      {
        match_percentage: final_match,
        is_icp: final_match >= threshold,
        strictness_level: profile.strictness_level,
        breakdown: {
          financial: score_financial.round(1),
          structure: score_structure.round(1),
          geo: score_geo.round(1),
          urgency: score_urgency.round(1)
        }
      }
    end

    private

    def calculate_financial_score(profile)
      bill = @lead_data[:monthly_bill].to_f
      min_bill = profile.min_monthly_bill.to_f
      return 70.0 if bill.zero? || min_bill.zero?

      return 100.0 if bill >= min_bill

      [((bill / min_bill) * 100.0), 10.0].max
    end

    def calculate_structure_score(profile)
      score = 50.0
      roof_type = @lead_data[:roof_type].to_s.downcase
      audience = @lead_data[:audience].to_s.upcase
      ev_type = @lead_data[:ev_charger_type].to_s.downcase

      preferred_roofs = Array(profile.preferred_roof_types).map(&:to_s).map(&:downcase)
      target_auds = Array(profile.target_audiences).map(&:to_s).map(&:upcase)
      ev_types = Array(profile.ev_charger_types).map(&:to_s).map(&:downcase)

      score += 25.0 if roof_type.present? && preferred_roofs.include?(roof_type)
      score += 15.0 if audience.present? && target_auds.include?(audience)
      score += 10.0 if ev_type.present? && ev_types.include?(ev_type)

      [score, 100.0].min
    end

    def calculate_geo_score(profile)
      return 100.0 if profile.nationwide?

      city = @lead_data[:city].to_s.strip
      state = @lead_data[:state].to_s.strip.upcase

      target_cities = Array(profile.target_cities).map(&:to_s).map(&:strip)
      target_states = Array(profile.target_states).map(&:to_s).map(&:strip).map(&:upcase)

      return 100.0 if city.present? && target_cities.include?(city)
      return 75.0  if state.present? && target_states.include?(state)

      # Se a empresa não tem cidades/estados configurados, aplica pontuação padrão neutra
      target_cities.empty? && target_states.empty? ? 70.0 : 30.0
    end

    def calculate_urgency_score
      urgency = @lead_data[:urgency].to_s.downcase
      case urgency
      when 'immediate', 'less_than_30_days', 'urgente' then 100.0
      when '1_to_3_months', 'medio_prazo' then 70.0
      else 50.0
      end
    end
  end
end
