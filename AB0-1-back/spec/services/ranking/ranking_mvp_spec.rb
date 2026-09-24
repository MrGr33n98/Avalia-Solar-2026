# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Ranking MVP Services' do
  describe Ranking::CompatibilityEngine do
    let(:engine) { described_class.new }

    it 'calculates organic score deterministically from features' do
      features = {
        trust_score: 0.9,
        delivered_projects_score: 0.8,
        response_time_sla_score: 0.7,
        warranty_score: 0.6
      }
      # (0.9*0.35) + (0.8*0.30) + (0.7*0.20) + (0.6*0.15) = 0.315 + 0.240 + 0.140 + 0.090 = 0.785 -> 78.50
      score = engine.calculate_score(features)
      expect(score).to eq(78.50)
    end

    it 'ranks population deterministically with tie-breaker by id' do
      companies = [
        { id: 2, name: 'B', features: { trust_score: 0.8 } },
        { id: 1, name: 'A', features: { trust_score: 0.8 } },
        { id: 3, name: 'C', features: { trust_score: 0.9 } }
      ]

      ranked = engine.rank_population(companies)

      expect(ranked[0][:id]).to eq(3)
      expect(ranked[0][:position]).to eq(1)
      expect(ranked[1][:id]).to eq(1) # tie broken by id ascending
      expect(ranked[1][:position]).to eq(2)
      expect(ranked[2][:id]).to eq(2)
      expect(ranked[2][:position]).to eq(3)
    end
  end

  describe Ranking::PositioningResolver do
    let(:resolver) { described_class.new }
    let(:scope) { RankingScope.from_params(state: 'SC') }

    it 'returns analysis_available: false for population under 5' do
      result = resolver.resolve(scope, [{ score: 80 }, { score: 70 }])
      expect(result[:analysis_available]).to be false
      expect(result[:reason]).to eq(:insufficient_population_for_benchmark)
    end

    it 'computes benchmark percentiles for population >= 5' do
      pop = [{ score: 50 }, { score: 60 }, { score: 70 }, { score: 80 }, { score: 90 }]
      result = resolver.resolve(scope, pop)

      expect(result[:analysis_available]).to be true
      expect(result[:median_score]).to eq(70.0)
      expect(result[:percentiles][:p50]).to eq(70.0)
    end
  end

  describe RankingRun do
    it 'creates an immutable run representation' do
      scope = RankingScope.from_params(state: 'SC')
      manifest = MethodologyManifest.organic_v2

      run = described_class.new(manifest: manifest, requested_scope: scope)
      expect(run.run_id).to be_present
      expect(run.as_of).to be_present
      expect(run.computed_at).to be_present
      expect(run.completed?).to be true
    end
  end

  describe Ranking::Ias::ExperimentalBoundary do
    it 'refuses score calculation when unapproved' do
      boundary = described_class.new
      expect { boundary.execute_score({ company_id: 1 }) }.to raise_error(
        Ranking::Ias::ExperimentalBoundary::MethodologicalApprovalError,
        /IAS score execution refused/
      )
    end
  end
end
