module Sales
  class OpportunityHealthCalculator
    def self.calculate(opportunity)
      new(opportunity).calculate
    end

    def initialize(opportunity)
      @opportunity = opportunity
      @account = opportunity.account
    end

    def calculate
      health = 100
      risks = []

      # Risk 1: No next activity scheduled
      if @opportunity.next_activity_at.blank? && @opportunity.tasks.pending.none?
        health -= 35
        risks << 'Sem próxima ação agendada (High Risk)'
      end

      # Risk 2: Stale deal (>5 days without activity)
      if @opportunity.last_activity_at.blank? || @opportunity.last_activity_at < 5.days.ago
        health -= 25
        risks << 'Oportunidade estagnada (>5 dias sem interação)'
      end

      # Risk 3: Low committee coverage
      coverage = @opportunity.committee_coverage_score rescue 0
      if coverage < 50
        health -= 20
        risks << 'Baixa cobertura do Comitê de Compras (<50%)'
      end

      # Risk 4: Overdue expected close
      if @opportunity.expected_close_date.present? && @opportunity.expected_close_date < Date.today
        health -= 20
        risks << 'Data prevista de fechamento vencida'
      end

      final_health = [health, 0].max
      { health_score: final_health, risk_factors: risks }
    end
  end
end
