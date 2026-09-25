# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    # Metodologia controlada pela equipe do Avalia Solar; não é configurável
    # pela empresa nem por parâmetros enviados ao endpoint.
    module Definition
      VERSION = 'positioning-v1'
      VERSION_V2 = 'positioning-v2'
      THRESHOLD_METHOD = 'median'

      X_AXIS = {
        trust_score: 0.45,
        verification: 0.20,
        review_credibility: 0.15,
        badge_depth: 0.10,
        social_proof: 0.10
      }.freeze

      Y_AXIS = {
        leads: 0.35,
        engagement: 0.25,
        conversion_efficiency: 0.20,
        operational_maturity: 0.10
      }.freeze

      CAPS = {
        review_volume_max: 200.0,
        badges_max: 10.0,
        execution_leads_max: 100.0,
        execution_views_max: 2_000.0,
        execution_clicks_max: 300.0,
        view_to_click_cap: 0.35,
        click_to_lead_cap: 0.60
      }.freeze

      CAPS_V2 = {
        review_volume_max: 200.0,
        badges_max: 10.0,
        execution_leads_max: 50.0,
        execution_engagement_max: 250.0,
        execution_views_max: 2_000.0,
        execution_clicks_max: 300.0,
        view_to_click_cap: 0.35,
        click_to_lead_cap: 0.60
      }.freeze

      REVIEWS_X_AXIS = { rating: 0.70, review_volume: 0.30 }.freeze
      REVIEWS_Y_AXIS = { review_volume: 0.45, review_credibility: 0.55 }.freeze

      QUADRANTS = {
        reference: {
          label: 'Referências',
          description: 'Acima das medianas de Autoridade e Execução no escopo comparável.'
        },
        specialist: {
          label: 'Especialistas',
          description: 'Autoridade acima da mediana, com Execução abaixo da mediana do escopo.'
        },
        expansion: {
          label: 'Em expansão',
          description: 'Execução acima da mediana, com Autoridade abaixo da mediana do escopo.'
        },
        developing: {
          label: 'Em desenvolvimento',
          description: 'Abaixo das medianas atuais nos dois eixos do escopo comparável.'
        }
      }.freeze

      module_function

      def quadrant_for(x_score, y_score, x_threshold, y_threshold)
        x_high = x_score.to_f >= x_threshold.to_f
        y_high = y_score.to_f >= y_threshold.to_f
        return :reference if x_high && y_high
        return :specialist if x_high
        return :expansion if y_high

        :developing
      end

      def quadrant_payload(key)
        QUADRANTS.fetch(key.to_sym).merge(key: key.to_s)
      end
    end
  end
end
