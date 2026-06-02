# frozen_string_literal: true

module Chat
  class LeadScoringService
    SCORING_RULES = {
      # Base
      vertical_selected:     10,
      location_provided:     15,
      wants_reviews:         10,
      wants_comparison:      20,
      selected_company:      25,
      wants_quote:           40,
      whatsapp_click:        40,
      contact_with_consent:  50,
      
      # Solar Specific
      solar_bill_low:        5,
      solar_bill_mid:        15,
      solar_bill_high:       25,
      solar_bill_very_high:  35,
      solar_bill_commercial: 45,
      solar_financing:       20,
      solar_has_proposal:    35,
      solar_urgent:          50,
      solar_maintenance:     20,
      solar_b2b_project:     30,

      # EV Specific
      ev_owner:              35,
      ev_hybrid_owner:       30,
      ev_buying_soon:        25,
      ev_b2b_project:        40,
      ev_public_station:     45,
      ev_tech_assessment:    25,
      ev_urgent:             50,
      ev_ready_30d:          40,
      ev_has_point:          20,
      ev_no_point:           15
    }.freeze

    TEMPERATURE_THRESHOLDS = {
      'hot'  => 60,
      'warm' => 30,
      'cold' => 0
    }.freeze

    # O parâmetro lead_profile é um Hash ou objeto OpenStruct com as respostas do discovery
    def self.calculate(profile)
      score = 0
      p = profile.is_a?(Hash) ? OpenStruct.new(profile) : profile

      # Base Scores
      score += SCORING_RULES[:vertical_selected] if p.vertical.present? && p.vertical != 'unknown'
      score += SCORING_RULES[:location_provided] if p.city.present? || p.state.present?
      score += SCORING_RULES[:wants_reviews] if p.wants_reviews
      score += SCORING_RULES[:wants_comparison] if p.wants_comparison
      score += SCORING_RULES[:selected_company] if p.selected_company_ids.present? && p.selected_company_ids.any?
      score += SCORING_RULES[:wants_quote] if p.wants_quote
      score += SCORING_RULES[:contact_with_consent] if p.lgpd_consent && (p.name.present? || p.phone.present?)

      # Vertical Specific
      if p.vertical == 'solar'
        score += calculate_solar_score(p)
      elsif p.vertical == 'electric_mobility'
        score += calculate_ev_score(p)
      end

      # Não clampamos a 100 aqui para permitir scores maiores em leads muito qualificados,
      # mas para a temperatura usaremos o teto de 100.
      score
    end

    def self.temperature_for(score)
      TEMPERATURE_THRESHOLDS.each do |temp, min_score|
        return temp if score >= min_score
      end
      'cold'
    end

    private

    def self.calculate_solar_score(p)
      s = 0
      case p.monthly_bill_range
      when 'up_to_300' then s += SCORING_RULES[:solar_bill_low]
      when '300_600'   then s += SCORING_RULES[:solar_bill_mid]
      when '600_1000'  then s += SCORING_RULES[:solar_bill_high]
      when '1000_3000' then s += SCORING_RULES[:solar_bill_very_high]
      when 'above_3000' then s += SCORING_RULES[:solar_bill_commercial]
      end

      s += SCORING_RULES[:solar_financing] if p.needs_financing
      s += SCORING_RULES[:solar_has_proposal] if p.buying_stage == 'has_proposal'
      s += SCORING_RULES[:solar_urgent] if p.buying_stage == 'urgent'
      s += SCORING_RULES[:solar_maintenance] if p.product_or_service == 'solar_maintenance'
      s += SCORING_RULES[:solar_b2b_project] if %w[commercial_solar rural_solar condominium_solar].include?(p.category)
      s
    end

    def self.calculate_ev_score(p)
      s = 0
      case p.ev_ownership
      when 'owns_ev'           then s += SCORING_RULES[:ev_owner]
      when 'owns_plugin_hybrid' then s += SCORING_RULES[:ev_hybrid_owner]
      when 'buying_soon'       then s += SCORING_RULES[:ev_buying_soon]
      when 'business_condo', 'fleet' then s += SCORING_RULES[:ev_b2b_project]
      end

      s += SCORING_RULES[:ev_public_station] if p.category == 'public_charging_station'
      s += SCORING_RULES[:ev_tech_assessment] if p.needs_technical_assessment
      s += SCORING_RULES[:ev_urgent] if p.buying_stage == 'urgent'
      s += SCORING_RULES[:ev_ready_30d] if p.buying_stage == 'ready_to_buy'
      s += SCORING_RULES[:ev_has_point] if p.has_electrical_point == true
      s += SCORING_RULES[:ev_no_point] if p.has_electrical_point == false
      s
    end
  end
end
