# frozen_string_literal: true

module Chat
  class LeadScoringService
    SCORING_RULES = {
      # Base
      vertical_selected: 10,
      location_provided: 15,
      wants_reviews: 10,
      wants_comparison: 20,
      selected_company: 25,
      wants_quote: 40,
      whatsapp_click: 40,
      contact_with_consent: 50,

      # Solar Specific
      solar_bill_low: 5,
      solar_bill_mid: 15,
      solar_bill_high: 25,
      solar_bill_very_high: 35,
      solar_bill_commercial: 45,
      solar_financing: 20,
      solar_has_proposal: 35,
      solar_urgent: 50,
      solar_maintenance: 20,
      solar_b2b_project: 30,

      # EV Specific
      ev_owner: 35,
      ev_hybrid_owner: 30,
      ev_buying_soon: 25,
      ev_b2b_project: 40,
      ev_public_station: 45,
      ev_tech_assessment: 25,
      ev_urgent: 50,
      ev_ready_30d: 40,
      ev_has_point: 20,
      ev_no_point: 15
    }.freeze

    TEMPERATURE_THRESHOLDS = {
      'hot' => 60,
      'warm' => 30,
      'cold' => 0
    }.freeze

    # O parâmetro lead_profile é um Hash ou objeto OpenStruct com as respostas do discovery
    def self.calculate(profile)
      intent_score = 0
      fit_score = 0
      explanation = {}
      
      p = profile.is_a?(Hash) ? OpenStruct.new(profile) : profile

      # Base Scores (Fit)
      if p.vertical.present? && p.vertical != 'unknown'
        fit_score += SCORING_RULES[:vertical_selected]
        explanation[:vertical_selected] = 'Vertical selecionada'
      end
      if p.city.present? || p.state.present?
        fit_score += SCORING_RULES[:location_provided]
        explanation[:location_provided] = 'Localização fornecida'
      end

      # Base Scores (Intent)
      wants_reviews = if p.respond_to?(:wants_reviews)
                        p.wants_reviews
                      elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                        p.metadata['wants_reviews'] || p.metadata[:wants_reviews]
                      end
      if wants_reviews
        intent_score += SCORING_RULES[:wants_reviews]
        explanation[:wants_reviews] = 'Busca avaliações'
      end

      wants_comparison = if p.respond_to?(:wants_comparison)
                           p.wants_comparison
                         elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                           p.metadata['wants_comparison'] || p.metadata[:wants_comparison]
                         end
      if wants_comparison
        intent_score += SCORING_RULES[:wants_comparison]
        explanation[:wants_comparison] = 'Busca comparação'
      end

      selected_ids = if p.respond_to?(:selected_company_ids)
                       p.selected_company_ids
                     elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                       p.metadata['comparison_company_ids'] || p.metadata[:comparison_company_ids] || p.metadata['recommended_company_ids'] || p.metadata[:recommended_company_ids]
                     end
      if selected_ids.present? && Array(selected_ids).any?
        intent_score += SCORING_RULES[:selected_company]
        explanation[:selected_company] = 'Empresa selecionada'
      end

      wants_quote = if p.respond_to?(:wants_quote)
                      p.wants_quote
                    elsif p.respond_to?(:metadata) && p.metadata.is_a?(Hash)
                      p.metadata['quote_requested_company_id'].present? || p.metadata[:quote_requested_company_id].present?
                    end
      if wants_quote
        intent_score += SCORING_RULES[:wants_quote]
        explanation[:wants_quote] = 'Solicitou orçamento'
      end

      lgpd_consent = if p.respond_to?(:lgpd_consent)
                       p.lgpd_consent
                     elsif p.respond_to?(:consent_given)
                       p.consent_given
                     end
      if lgpd_consent && (p.name.present? || p.phone.present?)
        intent_score += SCORING_RULES[:contact_with_consent]
        explanation[:contact_with_consent] = 'Contato com consentimento'
      end

      # Vertical Specific
      if p.vertical == 'solar'
        solar_res = calculate_solar_score(p)
        fit_score += solar_res[:fit_score]
        intent_score += solar_res[:intent_score]
        explanation.merge!(solar_res[:explanation])
      elsif p.vertical == 'electric_mobility'
        ev_res = calculate_ev_score(p)
        fit_score += ev_res[:fit_score]
        intent_score += ev_res[:intent_score]
        explanation.merge!(ev_res[:explanation])
      end

      total_score = fit_score + intent_score

      {
        total_score: total_score,
        intent_score: intent_score,
        fit_score: fit_score,
        explanation: explanation
      }
    end

    def self.temperature_for(score)
      TEMPERATURE_THRESHOLDS.each do |temp, min_score|
        return temp if score >= min_score
      end
      'cold'
    end

    def self.calculate_solar_score(p)
      fit_score = 0
      intent_score = 0
      explanation = {}
      
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
      when 'up_to_300' 
        fit_score += SCORING_RULES[:solar_bill_low]
        explanation[:solar_bill] = 'Conta Baixa'
      when '300_600'
        fit_score += SCORING_RULES[:solar_bill_mid]
        explanation[:solar_bill] = 'Conta Média'
      when '600_1000'
        fit_score += SCORING_RULES[:solar_bill_high]
        explanation[:solar_bill] = 'Conta Alta'
      when '1000_3000'
        fit_score += SCORING_RULES[:solar_bill_very_high]
        explanation[:solar_bill] = 'Conta Muito Alta'
      when 'above_3000'
        fit_score += SCORING_RULES[:solar_bill_commercial]
        explanation[:solar_bill] = 'Conta Comercial'
      end

      needs_financing = if p.respond_to?(:needs_financing)
                          p.needs_financing
                        else
                          p.respond_to?(:intent) && p.intent == 'solar_financing'
                        end
      if needs_financing
        intent_score += SCORING_RULES[:solar_financing]
        explanation[:solar_financing] = 'Busca financiamento'
      end

      buying_stage = if p.respond_to?(:buying_stage)
                       p.buying_stage
                     elsif p.respond_to?(:urgency) && p.urgency.present?
                       'urgent'
                     elsif p.respond_to?(:decision_timeline)
                       case p.decision_timeline
                       when 'immediate', 'this_week', 'this_month' then 'urgent'
                       else 'researching'
                       end
                     end
                     
      if buying_stage == 'has_proposal'
        intent_score += SCORING_RULES[:solar_has_proposal]
        explanation[:solar_has_proposal] = 'Já possui proposta'
      elsif buying_stage == 'urgent'
        intent_score += SCORING_RULES[:solar_urgent]
        explanation[:solar_urgent] = 'Urgência alta'
      end

      prod_or_serv = if p.respond_to?(:product_or_service)
                       p.product_or_service
                     else
                       p.respond_to?(:intent) ? p.intent : nil
                     end
      if prod_or_serv == 'solar_maintenance'
        intent_score += SCORING_RULES[:solar_maintenance]
        explanation[:solar_maintenance] = 'Manutenção'
      end

      category = if p.respond_to?(:category)
                   p.category
                 elsif p.respond_to?(:property_type)
                   p.property_type
                 end
      if %w[commercial_solar rural_solar condominium_solar commercial rural condominium].include?(category)
        fit_score += SCORING_RULES[:solar_b2b_project]
        explanation[:solar_b2b_project] = 'Projeto B2B (Solar)'
      end

      { fit_score: fit_score, intent_score: intent_score, explanation: explanation }
    end

    def self.calculate_ev_score(p)
      fit_score = 0
      intent_score = 0
      explanation = {}
      
      ev_ownership = if p.respond_to?(:ev_ownership)
                       p.ev_ownership
                     elsif p.respond_to?(:property_type) && %w[company condominium
                                                               public_site].include?(p.property_type)
                       'business_condo'
                     elsif p.respond_to?(:vehicle_count) && p.vehicle_count.to_i > 1
                       'fleet'
                     else
                       'owns_ev'
                     end

      case ev_ownership
      when 'owns_ev' 
        fit_score += SCORING_RULES[:ev_owner]
        explanation[:ev_owner] = 'Dono de VE'
      when 'owns_plugin_hybrid'
        fit_score += SCORING_RULES[:ev_hybrid_owner]
        explanation[:ev_hybrid_owner] = 'Dono Híbrido'
      when 'buying_soon'
        intent_score += SCORING_RULES[:ev_buying_soon]
        explanation[:ev_buying_soon] = 'Comprando em breve'
      when 'business_condo', 'fleet'
        fit_score += SCORING_RULES[:ev_b2b_project]
        explanation[:ev_b2b_project] = 'Projeto B2B (VE)'
      end

      category = if p.respond_to?(:category)
                   p.category
                 elsif p.respond_to?(:property_type)
                   p.property_type
                 end
      if category == 'public_charging_station'
        fit_score += SCORING_RULES[:ev_public_station]
        explanation[:ev_public_station] = 'Estação Pública'
      end

      needs_tech = if p.respond_to?(:needs_technical_assessment)
                     p.needs_technical_assessment
                   else
                     false
                   end
      if needs_tech
        intent_score += SCORING_RULES[:ev_tech_assessment]
        explanation[:ev_tech_assessment] = 'Análise Técnica'
      end

      urgency = if p.respond_to?(:urgency)
                  p.urgency
                elsif p.respond_to?(:decision_timeline)
                  case p.decision_timeline
                  when 'immediate' then 'high'
                  when 'this_month' then 'medium'
                  else 'low'
                  end
                end
      if urgency == 'high'
        intent_score += SCORING_RULES[:ev_urgent]
        explanation[:ev_urgent] = 'Alta Urgência'
      elsif urgency == 'medium'
        intent_score += SCORING_RULES[:ev_ready_30d]
        explanation[:ev_ready_30d] = 'Pronto 30 dias'
      end

      has_point = if p.respond_to?(:has_charging_point)
                    p.has_charging_point
                  else
                    nil
                  end
      if has_point == true
        fit_score += SCORING_RULES[:ev_has_point]
        explanation[:ev_has_point] = 'Tem ponto de recarga'
      elsif has_point == false
        fit_score += SCORING_RULES[:ev_no_point]
        explanation[:ev_no_point] = 'Sem ponto de recarga'
      end

      { fit_score: fit_score, intent_score: intent_score, explanation: explanation }
    end
  end
end
