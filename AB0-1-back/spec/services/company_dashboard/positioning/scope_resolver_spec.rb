# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::ScopeResolver do
  let(:population_loader) do
    lambda do |scope|
      populations.fetch([scope[:type], scope[:state], scope[:city]], [])
    end
  end
  let(:populations) do
    {
      %w[city SC Florianópolis] => [1],
      ['state', 'SC', nil] => [1, 2],
      ['global', nil, nil] => [1, 2, 3]
    }
  end

  it 'usa cidade quando a amostra é suficiente' do
    result = described_class.new(state: 'SC', city: 'Florianópolis', minimum_population: 1,
                                 population_loader: population_loader).resolve
    expect(result[:resolved_scope]).to include(type: 'city')
    expect(result[:fallback]).to be(false)
  end

  it 'faz fallback explícito de cidade para estado' do
    result = described_class.new(state: 'SC', city: 'Florianópolis', minimum_population: 2,
                                 population_loader: population_loader).resolve
    expect(result[:resolved_scope]).to include(type: 'state', state: 'SC', city: nil)
    expect(result[:fallback]).to be(true)
    expect(result[:fallback_reason]).to eq('insufficient_sample')
  end
end
