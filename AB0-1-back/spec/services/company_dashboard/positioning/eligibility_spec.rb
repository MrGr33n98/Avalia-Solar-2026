# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::Eligibility do
  it 'bloqueia população curta e distribuição degenerada' do
    service = described_class.new(minimum_population: 3)
    expect(service.call([{ x_score: 1, y_score: 1 }])[:status]).to eq('insufficient_sample')
    result = service.call([{ x_score: 1, y_score: 1 }, { x_score: 1, y_score: 2 }, { x_score: 1, y_score: 3 }])
    expect(result[:status]).to eq('insufficient_sample')
    expect(result[:quality_flags]).to include('degenerate_x_distribution')
  end

  it 'libera população com massa e variação em ambos os eixos' do
    points = 4.times.map { |index| { x_score: index + 1, y_score: 4 - index } }
    expect(described_class.new(minimum_population: 4).call(points)[:status]).to eq('ready')
  end

  it 'detecta low-spread e floor concentration mesmo quando mediana > 0 e zero_ratio = 0' do
    # Fixture exata do checklist: Y = 1.8, 1.9, 2.0, 2.1, 2.2, 2.2, 2.3, 2.5, 3.0, 3.2
    y_values = [1.8, 1.9, 2.0, 2.1, 2.2, 2.2, 2.3, 2.5, 3.0, 3.2]
    points = y_values.each_with_index.map do |y, idx|
      { x_score: (idx + 1) * 8.0, y_score: y }
    end

    result = described_class.new(minimum_population: 5).call(points)
    expect(result[:status]).to eq('ready')
    expect(result[:quality_flags]).to include('low_spread_y')
    expect(result[:quality_flags]).to include('floor_concentration_y')
    expect(result[:warning_flags]).to include('low_spread_y', 'floor_concentration_y')
    expect(result[:distribution][:y][:effective_range]).to be < 5.0
    expect(result[:distribution][:y][:floor_ratio]).to be >= 0.50
  end
end
