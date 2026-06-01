# frozen_string_literal: true

module Chat
  class InsightExtractionService
    def self.extract_from_lead(lead)
      return unless ENV.fetch('CHAT_INSIGHTS_ENABLED', 'true') == 'true'

      insights = []

      # City demand
      if lead.city.present? && lead.vertical.present?
        insights << {
          insight_type: 'city_demand',
          vertical: lead.vertical,
          city: lead.city,
          state: lead.state,
          title: "Demanda em #{lead.city}/#{lead.state} para #{lead.vertical}",
          confidence_score: 0.8
        }
      end

      # Intent tracking
      if lead.intent.present?
        insights << {
          insight_type: 'market_demand',
          vertical: lead.vertical,
          title: "Interesse detectado: #{lead.intent}",
          confidence_score: 0.7
        }
      end

      # Objections
      if lead.objections.present? && lead.objections.is_a?(Array) && lead.objections.any?
        lead.objections.each do |objection|
          insights << {
            insight_type: 'sales_objection',
            vertical: lead.vertical,
            city: lead.city,
            title: "Objeção: #{objection.to_s.truncate(100)}",
            confidence_score: 0.6
          }
        end
      end

      # Pain points
      if lead.pain_points.present? && lead.pain_points.is_a?(Array) && lead.pain_points.any?
        lead.pain_points.each do |pain|
          insights << {
            insight_type: 'frequent_question',
            vertical: lead.vertical,
            title: "Dor/Dúvida: #{pain.to_s.truncate(100)}",
            confidence_score: 0.6
          }
        end
      end

      # Save insights
      now = Time.current
      insights.each do |attrs|
        ChatInsight.create!(
          attrs.merge(
            source_period_start: now.beginning_of_day,
            source_period_end: now.end_of_day
          )
        )
      end

      insights.length
    rescue StandardError => e
      Rails.logger.warn("[Chat::InsightExtraction] Failed: #{e.message}")
      0
    end
  end
end
