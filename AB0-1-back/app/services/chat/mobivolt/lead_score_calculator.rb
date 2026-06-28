# frozen_string_literal: true

module Chat
  module Mobivolt
    class LeadScoreCalculator
      def self.calculate(chat_lead)
        new(chat_lead).calculate
      end

      def self.qualification_level(score)
        if score >= 70
          'quente'
        elsif score >= 40
          'morno'
        else
          'frio'
        end
      end

      def initialize(chat_lead)
        @lead = chat_lead
        @metadata = @lead.metadata || {}
      end

      def calculate
        score = 0

        # 1. Localização identificada (+15)
        score += 15 if @lead.city.present? || @lead.state.present?

        # 2. Intenção comercial clara (+20)
        commercial_intents = %w[solar_quote ev_charger_installation condominium_charging fleet_electrification
                                company_recommendation compare_companies]
        score += 20 if commercial_intents.include?(@lead.intent)

        # 3. Empresa recomendada (+10)
        recommended_ids = Array(@metadata['recommended_company_ids'])
        score += 10 if recommended_ids.any?

        # 4. Clicou em empresa (+15)
        score += 15 if @metadata['clicked_company_id'].present?

        # 5. Pediu orçamento (+20)
        score += 20 if @metadata['quote_requested_company_id'].present?

        # 6. Informou WhatsApp com consentimento (+20)
        score += 20 if @lead.phone.present? && @lead.consent_given?

        # 7. Informou E-mail (+5)
        score += 5 if @lead.email.present?

        # 8. Urgência detectada (+10)
        urgency_value = @lead.urgency.to_s.downcase
        score += 10 if %w[imediata urgente alta 1_mes].include?(urgency_value) || urgency_value.include?('imediata')

        # 9. Possui proposta concorrente para análise (+10)
        # Verificamos no project_type ou nos pain_points/objections
        is_comparing = @lead.project_type.to_s.downcase == 'comparativo' ||
                       Array(@lead.pain_points).any? do |p|
                         p.to_s.downcase.include?('proposta') || p.to_s.downcase.include?('concorrente')
                       end ||
                       Array(@lead.objections).any? do |o|
                         o.to_s.downcase.include?('preço') || o.to_s.downcase.include?('proposta')
                       end
        score += 10 if is_comparing

        # Limita de 0 a 100
        score.clamp(0, 100)
      end
    end
  end
end
