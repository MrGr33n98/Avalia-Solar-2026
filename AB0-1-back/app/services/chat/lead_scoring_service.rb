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

      wants_reviews = if p.respond_to?(:wants_reviews)
                        p.wants_reviews
                      elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                        p.metadata['wants_reviews'] || p.metadata[:wants_reviews]
                      end
      score += SCORING_RULES[:wants_reviews] if wants_reviews

      wants_comparison = if p.respond_to?(:wants_comparison)
                           p.wants_comparison
                         elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                           p.metadata['wants_comparison'] || p.metadata[:wants_comparison]
                         end
      score += SCORING_RULES[:wants_comparison] if wants_comparison

      selected_ids = if p.respond_to?(:selected_company_ids)
                       p.selected_company_ids
                     elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                       p.metadata['comparison_company_ids'] || p.metadata[:comparison_company_ids] || p.metadata['recommended_company_ids'] || p.metadata[:recommended_company_ids]
                     end
      score += SCORING_RULES[:selected_company] if selected_ids.present? && Array(selected_ids).any?

      wants_quote = if p.respond_to?(:wants_quote)
                      p.wants_quote
                    elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                      p.metadata['quote_requested_company_id'].present? || p.metadata[:quote_requested_company_id].present?
                    end
      score += SCORING_RULES[:wants_quote] if wants_quote

      lgpd_consent = if p.respond_to?(:lgpd_consent)
                       p.lgpd_consent
                     elsif p.respond_to?(:consent_given)
                       p.consent_given
                     end
      score += SCORING_RULES[:contact_with_consent] if lgpd_consent && (p.name.present? || p.phone.present?)

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
      bill_range = if p.respond_to?(:monthly_bill_range)
                     p.monthly_bill_range
                   elsif p.respond_to?(:monthly_bill)
                     case p.monthly_bill.to_s
                     when '300' then 'up_to_300'
                     when '600' then '300_600'
                     when '1200' then '600_1000'
                     when '3000' then '1000_3000'
                     when '5000' then 'above_3000'
                     else p.monthly_bill.to_s
                     end
                   end

      case bill_range
      when 'up_to_300' then s += SCORING_RULES[:solar_bill_low]
      when '300_600'   then s += SCORING_RULES[:solar_bill_mid]
      when '600_1000'  then s += SCORING_RULES[:solar_bill_high]
      when '1000_3000' then s += SCORING_RULES[:solar_bill_very_high]
      when 'above_3000' then s += SCORING_RULES[:solar_bill_commercial]
      end

      needs_financing = if p.respond_to?(:needs_financing)
                          p.needs_financing
                        else
                          p.respond_to?(:intent) && p.intent == 'solar_financing'
                        end
      s += SCORING_RULES[:solar_financing] if needs_financing

      buying_stage = if p.respond_to?(:buying_stage)
                       p.buying_stage
                     else
                       if p.respond_to?(:urgency) && p.urgency.present?
                         'urgent'
                       elsif p.respond_to?(:decision_timeline)
                         case p.decision_timeline
                         when 'immediate', 'this_week', 'this_month' then 'urgent'
                         else 'researching'
                         end
                       end
                     end
      s += SCORING_RULES[:solar_has_proposal] if buying_stage == 'has_proposal'
      s += SCORING_RULES[:solar_urgent] if buying_stage == 'urgent'

      prod_or_serv = if p.respond_to?(:product_or_service)
                       p.product_or_service
                     else
                       p.respond_to?(:intent) ? p.intent : nil
                     end
      s += SCORING_RULES[:solar_maintenance] if prod_or_serv == 'solar_maintenance'

      category = if p.respond_to?(:category)
                   p.category
                 elsif p.respond_to?(:property_type)
                   p.property_type
                 end
      s += SCORING_RULES[:solar_b2b_project] if %w[commercial_solar rural_solar condominium_solar commercial rural condominium].include?(category)
      s
    end

    def self.calculate_ev_score(p)
      s = 0
      ev_ownership = if p.respond_to?(:ev_ownership)
                       p.ev_ownership
                     else
                       if p.respond_to?(:property_type) && %w[company condominium public_site].include?(p.property_type)
                         'business_condo'
                       elsif p.respond_to?(:vehicle_count) && p.vehicle_count.to_i > 1
                         'fleet'
                       else
                         'owns_ev'
                       end
                     end

      case ev_ownership
      when 'owns_ev'           then s += SCORING_RULES[:ev_owner]
      when 'owns_plugin_hybrid' then s += SCORING_RULES[:ev_hybrid_owner]
      when 'buying_soon'       then s += SCORING_RULES[:ev_buying_soon]
      when 'business_condo', 'fleet' then s += SCORING_RULES[:ev_b2b_project]
      end

      category = if p.respond_to?(:category)
                   p.category
                 elsif p.respond_to?(:property_type)
                   p.property_type
                 end
      s += SCORING_RULES[:ev_public_station] if category == 'public_charging_station'

      needs_tech = if p.respond_to?(:needs_technical_assessment)
                     p.needs_technical_assessment
                   else
                     false
                   end
      s += SCORING_RULES[:ev_tech_assessment] if needs_tech

      buying_stage = if p.respond_to?(:buying_stage)
                       p.buying_stage
                     else
                       if p.respond_to?(:urgency) && p.urgency.present?
                         'urgent'
                       elsif p.respond_to?(:decision_timeline)
                         case p.decision_timeline
                         when 'immediate', 'this_week', 'this_month' then 'urgent'
                         else 'researching'
                         end
                       end
                     end
      s += SCORING_RULES[:ev_urgent] if buying_stage == 'urgent'
      s += SCORING_RULES[:ev_ready_30d] if buying_stage == 'ready_to_buy'

      has_pt = if p.respond_to?(:has_electrical_point)
                 p.has_electrical_point
               else
                 nil
               end
      s += SCORING_RULES[:ev_has_point] if has_pt == true
      s += SCORING_RULES[:ev_no_point] if has_pt == false
      s
    end
  end
end
