module Sales
  class EngagementScoreCalculator
    def self.calculate(account)
      new(account).calculate
    end

    def initialize(account)
      @account = account
      @emails = account.email_messages rescue []
      @activities = account.activities
    end

    def calculate
      score = 0
      breakdown = []

      # Email engagement
      if @account.email_messages.where('open_count > 0').exists?
        score += 25
        breakdown << { points: 25, text: 'E-mails comerciais abertos pelo prospect' }
      end

      if @account.email_messages.where('click_count > 0').exists?
        score += 25
        breakdown << { points: 25, text: 'Cliques registrados em links da proposta/apresentação' }
      end

      # Calls answered
      if @activities.where(activity_type: 'call').exists?
        score += 25
        breakdown << { points: 25, text: 'Ligação de atendimento realizada' }
      end

      # Recency
      last_activity = @activities.order(occurred_at: :desc).first
      if last_activity && last_activity.occurred_at >= 7.days.ago
        score += 25
        breakdown << { points: 25, text: 'Engajamento recente nos últimos 7 dias' }
      elsif last_activity && last_activity.occurred_at >= 30.days.ago
        score += 10
        breakdown << { points: 10, text: 'Interação registrada nos últimos 30 dias' }
      end

      final_score = [score, 100].min
      { score: final_score, breakdown: breakdown }
    end
  end
end
