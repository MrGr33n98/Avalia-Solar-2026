# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingBenchmarkService do
  Row = Struct.new(:ranking_score)

  it 'calculates real distribution percentiles from the supplied population' do
    result = described_class.new(population: [10, 20, 30, 40].map { |score| Row.new(score) }, minimum_population: 4).call

    expect(result).to include(
      status: 'ready', population: 4, minimum_population: 4,
      median_score: 25.0, p75_score: 32.5, p90_score: 37.0
    )
    expect(result[:distribution]).to include(
      min_score: 10.0, max_score: 40.0, distinct_score_count: 4
    )
  end

  it 'withholds benchmark values below the configured minimum sample' do
    result = described_class.new(population: [Row.new(10), Row.new(20)], minimum_population: 3).call

    expect(result).to include(status: 'insufficient_sample', population: 2, median_score: nil, p75_score: nil, p90_score: nil)
  end

  it 'reports an empty population without manufacturing a benchmark' do
    result = described_class.new(population: [], minimum_population: 3).call

    expect(result).to include(status: 'empty', population: 0, median_score: nil, p75_score: nil, p90_score: nil)
  end
end
