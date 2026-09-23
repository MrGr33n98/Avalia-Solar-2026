# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::ThresholdCalculator do
  def points(values)
    values.map { |x, y| { x_score: x, y_score: y } }
  end

  it 'calcula a mediana ímpar e mantém eixos independentes' do
    result = described_class.new(points([[10, 90], [20, 10], [30, 50]])).call
    expect(result).to include(method: 'median', population_size: 3, x_threshold: 20.0, y_threshold: 50.0)
  end

  it 'calcula a média dos dois centrais em população par' do
    result = described_class.new(points([[10, 10], [20, 20], [30, 30], [40, 40]])).call
    expect(result).to include(x_threshold: 25.0, y_threshold: 25.0)
  end

  it 'não fabrica threshold para população vazia' do
    result = described_class.new([]).call
    expect(result).to include(x_threshold: nil, y_threshold: nil, population_size: 0)
  end
end
