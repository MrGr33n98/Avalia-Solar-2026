# frozen_string_literal: true

module TrustScore
  # Fachada de compatibilidade para consumidores síncronos. A fórmula fica em
  # Definition/Calculator para não divergir do worker diário.
  class CalculationService
    WEIGHTS = Definition::WEIGHTS
    MAX_VALUES = Definition::MAX_VALUES

    attr_reader :company

    def initialize(company)
      @company = company
    end

    def calculate!
      result = Calculator.new(company).call
      previous_score = fetch_previous_score

      result.merge(
        previous_score: previous_score,
        score_changed: previous_score.nil? || result[:score] != previous_score
      )
    end

    def self.fetch_stored(company_id)
      record = CompanyTrustScore.find_by(company_id: company_id)
      record&.score&.to_f || 0.0
    end

    def self.calculate_inline(company)
      new(company).calculate![:score]
    end

    private

    def fetch_previous_score
      CompanyTrustScore.find_by(company_id: company.id)&.score&.to_f
    end
  end
end
