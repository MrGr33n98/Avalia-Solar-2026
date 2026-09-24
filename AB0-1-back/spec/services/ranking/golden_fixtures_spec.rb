# frozen_string_literal: true

require 'json'
require_relative '../../../app/models/methodology_manifest'
require_relative '../../../app/services/ranking/compatibility_engine'

RSpec.describe 'Ranking Golden Fixtures (ORG-001)' do
  let(:manifest) { MethodologyManifest.organic_v2 }
  let(:engine) { Ranking::CompatibilityEngine.new(manifest: manifest) }
  let(:fixture_data) do
    path = File.expand_path('../../fixtures/ranking/golden_cases.json', __dir__)
    JSON.parse(File.read(path), symbolize_names: true)
  end

  it 'matches exact expected score for all golden test cases' do
    fixture_data[:cases].each do |c|
      score = engine.calculate_score(c[:features])
      expect(score).to eq(c[:expected_score]), "Expected company #{c[:id]} (#{c[:name]}) to have score #{c[:expected_score]}, got #{score}"
    end
  end

  it 'deterministically breaks ties by ID ascending' do
    companies = fixture_data[:cases].map do |c|
      { id: c[:id], name: c[:name], features: c[:features] }
    end

    ranked = engine.rank_population(companies)

    fixture_data[:cases].each do |c|
      match = ranked.find { |r| r[:id] == c[:id] }
      expect(match[:position]).to eq(c[:expected_rank]), "Expected company #{c[:id]} to rank #{c[:expected_rank]}, ranked #{match[:position]}"
    end
  end
end
