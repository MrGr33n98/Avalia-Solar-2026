module Leads
  class LeadScoringService
    WEIGHTS = {
      category: 15,
      location: 10,
      phone: 15,
      timeline: 20,
      budget: 15,
      preferred_company: 10,
      comparison: 5,
      wizard_complete: 5
    }.freeze

    def self.call(lead)
      new(lead).call
    end

    def initialize(lead)
      @lead = lead
    end

    def call
      factors = {
        category: positive?(@lead.category_id),
        location: positive?(@lead.city) || positive?(@lead.state),
        phone: @lead.phone.to_s.gsub(/\D/, '').length >= 10,
        timeline: urgent_timeline?,
        budget: positive?(@lead.estimated_budget) || positive?(@lead.bill_value),
        preferred_company: positive?(@lead.company_id) || positive?(@lead.quote_requested_company_id),
        comparison: Array(@lead.comparison_company_ids).any?,
        wizard_complete: @lead.wizard_status.to_s.in?(%w[verified distributed])
      }
      total = factors.sum { |key, enabled| enabled ? WEIGHTS.fetch(key) : 0 }
      { total_score: [total, 100].min, score_band: band_for(total), factors: factors }
    end

    private

    def positive?(value)
      value.present?
    end

    def urgent_timeline?
      value = @lead.decision_timeline.to_s.downcase
      value.match?(/immediate|agora|30|7|urgente|asap/)
    end

    def band_for(score)
      case score
      when 0..29 then 'low'
      when 30..59 then 'medium'
      when 60..79 then 'high'
      else 'very_high'
      end
    end
  end
end
