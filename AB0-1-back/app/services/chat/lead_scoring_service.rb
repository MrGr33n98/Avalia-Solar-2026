# frozen_string_literal: true

module Chat
  class LeadScoringService
    SCORING_RULES = {
      phone:              30,
      city:               20,
      clear_intent:       25,
      relevant_data:      25,
      from_compare:       10,
      from_company:       10,
      explicit_quote:     10,
      high_engagement:    10,
      spam_penalty:       -20,
      no_consent_penalty: -20
    }.freeze

    TEMPERATURE_THRESHOLDS = {
      'muito_quente' => 81,
      'quente'       => 61,
      'morno'        => 31,
      'frio'         => 0
    }.freeze

    def self.calculate(lead)
      score = 0

      score += SCORING_RULES[:phone] if lead.phone.present?
      score += SCORING_RULES[:city] if lead.city.present?
      score += SCORING_RULES[:clear_intent] if lead.intent.present?

      # Dados relevantes
      has_data = [
        lead.monthly_bill.present?,
        lead.property_type.present?,
        lead.vehicle_count.present?,
        lead.solution_type.present?,
        lead.budget_range.present?,
        lead.decision_timeline.present?
      ].any?
      score += SCORING_RULES[:relevant_data] if has_data

      # Origem
      score += SCORING_RULES[:from_compare] if lead.source_page&.include?('/compare')
      score += SCORING_RULES[:from_company] if lead.source_page&.include?('/companies/')
      score += SCORING_RULES[:explicit_quote] if %w[solar_quote ev_charger_installation].include?(lead.intent)

      # Engajamento
      session = lead.chat_session
      score += SCORING_RULES[:high_engagement] if session&.message_count.to_i > 3

      # Penalidades
      score += SCORING_RULES[:no_consent_penalty] unless lead.consent_given?

      score.clamp(0, 100)
    end

    def self.temperature_for(score)
      TEMPERATURE_THRESHOLDS.each do |temp, min_score|
        return temp if score >= min_score
      end
      'frio'
    end
  end
end
