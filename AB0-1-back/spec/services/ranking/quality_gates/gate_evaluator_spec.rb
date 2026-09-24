# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ranking::QualityGates::GateEvaluator do
  let(:scope) { RankingScope.from_params(state: 'SC', category: '10') }

  describe '#evaluate' do
    it 'passes publication when population meets minimum threshold' do
      evaluator = described_class.new(min_population: 5)
      summary = evaluator.evaluate(scope, population_count: 8)

      expect(summary.passed?).to be true
      expect(summary.analysis_available?).to be true
    end

    it 'fails publication when population is below minimum' do
      evaluator = described_class.new(min_population: 5)
      summary = evaluator.evaluate(scope, population_count: 2)

      expect(summary.passed?).to be false
      expect(summary.analysis_available?).to be false
    end

    it 'allows ranking publication while analysis is unavailable for small populations' do
      evaluator = described_class.new(min_population: 2)
      # population is 3 (>= 2 so ranking passes, but < 5 so benchmark/analysis unavailable)
      summary = evaluator.evaluate(scope, population_count: 3)

      expect(summary.passed?).to be true
      expect(summary.analysis_available?).to be false
    end
  end
end
