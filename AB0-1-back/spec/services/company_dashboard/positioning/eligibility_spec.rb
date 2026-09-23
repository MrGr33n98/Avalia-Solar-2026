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
end
