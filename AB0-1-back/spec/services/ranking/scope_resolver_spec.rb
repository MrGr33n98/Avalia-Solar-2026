# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ranking::ScopeResolver do
  let(:municipality_territory) { Territory.municipality('Florianópolis', uf: 'SC') }
  let(:requested_scope) do
    RankingScope.new(
      methodology_release: 'organic-performance-v2@2.0.0',
      basis: :service_coverage,
      territory: municipality_territory,
      category_id: 10
    )
  end

  describe '#build_candidate_ladder' do
    it 'builds city -> state -> country candidate ladder' do
      resolver = described_class.new
      ladder = resolver.build_candidate_ladder(requested_scope)

      expect(ladder.size).to eq(3)
      expect(ladder[0].territory_canonical_id).to eq('BR-SC-florianopolis')
      expect(ladder[1].territory_canonical_id).to eq('BR-SC')
      expect(ladder[2].territory_canonical_id).to eq('BR')

      # Invariant: dimensions are strictly preserved
      ladder.each do |candidate|
        expect(candidate.basis).to eq(:service_coverage)
        expect(candidate.category_id).to eq(10)
        expect(candidate.methodology_release).to eq('organic-performance-v2@2.0.0')
      end
    end
  end

  describe '#resolve' do
    it 'resolves requested scope directly when it passes' do
      resolver = described_class.new
      result = resolver.resolve(requested_scope) { true }

      expect(result.resolved?).to be true
      expect(result.fallback?).to be false
      expect(result.resolved_scope.territory_canonical_id).to eq('BR-SC-florianopolis')
      expect(result.reason).to eq(:requested_scope_passed)
    end

    it 'falls back to state when city fails and state passes' do
      resolver = described_class.new
      result = resolver.resolve(requested_scope) do |candidate|
        candidate.territory_canonical_id != 'BR-SC-florianopolis'
      end

      expect(result.resolved?).to be true
      expect(result.fallback?).to be true
      expect(result.resolved_scope.territory_canonical_id).to eq('BR-SC')
      expect(result.reason).to eq(:broadened_to_parent_territory)
    end

    it 'returns no_eligible_scope when all candidates fail' do
      resolver = described_class.new
      result = resolver.resolve(requested_scope) { false }

      expect(result.resolved?).to be false
      expect(result.no_eligible_scope?).to be true
      expect(result.resolved_scope).to be_nil
      expect(result.reason).to eq(:no_eligible_scope)
    end
  end
end
