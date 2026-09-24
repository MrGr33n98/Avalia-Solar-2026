# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::PointSelector do
  it 'mantém população estatística separada da população visual' do
    population = 100.times.map { |id| Struct.new(:id).new(id + 1) }
    result = described_class.new.call(population: population, company_id: 50, point_builder: lambda { |record|
      { id: record.id }
    })
    expect(result[:eligible_population_count]).to eq(100)
    expect(result[:displayed_count]).to be <= 16
    expect(result[:points].map { |point| point[:id] }).to include(50)
  end

  it 'não falha quando a empresa atual não está na população elegível' do
    population = 3.times.map { |id| Struct.new(:id).new(id + 1) }

    result = described_class.new.call(population: population, company_id: 99, point_builder: lambda { |record|
      { id: record.id }
    })

    expect(result[:points].map { |point| point[:id] }).to eq([1, 2, 3])
  end
end
