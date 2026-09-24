# frozen_string_literal: true

require_relative '../../../app/services/ranking/shadow_engine_comparator'

RSpec.describe Ranking::ShadowEngineComparator do
  describe '.compare' do
    context 'when legacy and canonical ranking match perfectly' do
      let(:legacy) do
        [
          { id: 1, score: 95.0, position: 1 },
          { id: 2, score: 85.0, position: 2 }
        ]
      end

      let(:canonical) do
        [
          { id: 1, organic_score: 95.0, position: 1 },
          { id: 2, organic_score: 85.0, position: 2 }
        ]
      end

      it 'reports perfect match and zero churn' do
        result = described_class.compare(legacy, canonical)

        expect(result[:perfect_match]).to be true
        expect(result[:max_score_drift]).to eq(0.0)
        expect(result[:position_churn_count]).to eq(0)
        expect(result[:population_diff]).to eq(0)
      end
    end

    context 'when there is score drift and position churn' do
      let(:legacy) do
        [
          { id: 1, score: 90.0, position: 1 },
          { id: 2, score: 88.0, position: 2 }
        ]
      end

      let(:canonical) do
        [
          { id: 2, organic_score: 91.0, position: 1 },
          { id: 1, organic_score: 89.0, position: 2 }
        ]
      end

      it 'detects score drifts and position inversions' do
        result = described_class.compare(legacy, canonical)

        expect(result[:perfect_match]).to be false
        expect(result[:max_score_drift]).to eq(3.0)
        expect(result[:position_churn_count]).to eq(2)
      end
    end
  end
end
