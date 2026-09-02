module Sales
  class FitScoreCalculator
    def self.calculate(account)
      new(account).calculate
    end

    def initialize(account)
      @account = account
      @company = account.company
      @contacts = account.contacts
    end

    def calculate
      score = 0
      reasons = []

      # 1. Segment Fit (max 30 pts)
      if @account.segment.present?
        score += 30
        reasons << { points: 30, text: "Segmento alvo identificado: #{@account.segment}" }
      else
        reasons << { points: 0, text: 'Segmento não informado' }
      end

      # 2. Geography Fit (max 20 pts)
      if @account.state.present? && @account.city.present?
        score += 20
        reasons << { points: 20, text: "Localização mapeada: #{@account.city}/#{@account.state}" }
      elsif @account.state.present?
        score += 10
        reasons << { points: 10, text: "Estado mapeado: #{@account.state}" }
      end

      # 3. Marketplace Fit (max 25 pts)
      if @company.present?
        if @company.try(:verified)
          score += 10
          reasons << { points: 10, text: 'Empresa já possui Selo Verificado no Marketplace' }
        end

        rating_avg = @company.try(:rating_avg).to_f
        rating_count = @company.try(:rating_count).to_i

        if rating_avg >= 4.0 && rating_count > 0
          score += 15
          reasons << { points: 15, text: "Excelente reputação pública: #{rating_avg.round(1)} ★ (#{rating_count} avaliações)" }
        elsif rating_count > 0
          score += 8
          reasons << { points: 8, text: "Presença com avaliações no portal (#{rating_count} avaliações)" }
        end
      end

      # 4. Contactability (max 15 pts)
      if @account.phone.present? || @account.email.present? || @contacts.any? { |c| c.phone.present? || c.email.present? }
        score += 15
        reasons << { points: 15, text: 'Canais diretos de contato validados (Telefone/Email)' }
      end

      # 5. Committee Coverage (max 10 pts)
      if @contacts.any? { |c| c.decision_role.present? }
        score += 10
        reasons << { points: 10, text: 'Decisor comercial identificado no Comitê' }
      end

      final_score = [score, 100].min
      { score: final_score, breakdown: reasons }
    end
  end
end
