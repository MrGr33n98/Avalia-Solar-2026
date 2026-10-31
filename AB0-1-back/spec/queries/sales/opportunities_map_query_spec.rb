# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::OpportunitiesMapQuery do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:pipeline) { Sales::Pipeline.create!(name: 'B2B', key: "b2b_#{SecureRandom.hex(4)}") }
  let(:stage) { pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 0, probability: 10) }

  let(:account_cuiaba) do
    Sales::Account.create!(name: 'Solar Cuiaba', owner: owner, city: 'Cuiabá', state: 'MT', country: 'BR')
  end

  let(:account_sp) do
    Sales::Account.create!(name: 'Solar SP', owner: owner, city: 'São Paulo', state: 'SP', country: 'BR')
  end

  let(:account_unsupported) do
    Sales::Account.create!(name: 'Solar Desconhecida', owner: owner, city: 'CidadeInexistenteNoCatalogoXYZ', state: 'MT', country: 'BR')
  end

  let(:account_no_location) do
    Sales::Account.create!(name: 'Sem Cidade', owner: owner, city: nil, state: nil, country: 'BR')
  end

  it 'returns empty locations and zero summary when there are no opportunities' do
    result = described_class.call({}, Sales::Opportunity.none)

    expect(result[:summary][:total_filtered]).to eq(0)
    expect(result[:summary][:mappable]).to eq(0)
    expect(result[:summary][:unmapped]).to eq(0)
    expect(result[:locations]).to eq([])
    expect(result[:meta][:location_source]).to eq('offline_city_centroids')
  end

  it 'groups multiple leads in the same city into a single pin without duplicate values' do
    account_cuiaba.opportunities.create!(name: 'Lead 1', pipeline: pipeline, stage: stage, owner: owner, value_cents: 100_000, status: 'open')
    account_cuiaba.opportunities.create!(name: 'Lead 2', pipeline: pipeline, stage: stage, owner: owner, value_cents: 200_000, status: 'won')
    account_cuiaba.opportunities.create!(name: 'Lead 3', pipeline: pipeline, stage: stage, owner: owner, value_cents: 300_000, status: 'lost')

    scope = Sales::Opportunity.where(sales_account_id: account_cuiaba.id)
    result = described_class.call({ all_statuses: true }, scope)

    expect(result[:summary][:total_filtered]).to eq(3)
    expect(result[:summary][:mappable]).to eq(3)
    expect(result[:summary][:unmapped]).to eq(0)
    expect(result[:summary][:total_value_cents]).to eq(600_000)

    expect(result[:locations].size).to eq(1)
    location = result[:locations].first
    expect(location[:city]).to eq('Cuiabá')
    expect(location[:state]).to eq('MT')
    expect(location[:lead_count]).to eq(3)
    expect(location[:value_cents]).to eq(600_000)
    expect(location[:status_counts]).to eq({ 'open' => 1, 'won' => 1, 'lost' => 1 })
    expect(location[:latitude]).to be_present
    expect(location[:longitude]).to be_present
  end

  it 'maintains strict invariant total_filtered = mappable + unmapped and separates reasons' do
    account_cuiaba.opportunities.create!(name: 'Mappable', pipeline: pipeline, stage: stage, owner: owner, value_cents: 50_000)
    account_unsupported.opportunities.create!(name: 'Unsupported', pipeline: pipeline, stage: stage, owner: owner, value_cents: 60_000)
    account_no_location.opportunities.create!(name: 'Missing City State', pipeline: pipeline, stage: stage, owner: owner, value_cents: 70_000)

    result = described_class.call({ all_statuses: true })

    summary = result[:summary]
    expect(summary[:total_filtered]).to eq(summary[:mappable] + summary[:unmapped])
    expect(summary[:unmapped]).to eq(summary[:missing_city_state] + summary[:unsupported_municipality])
    expect(summary[:mappable]).to eq(1)
    expect(summary[:missing_city_state]).to eq(1)
    expect(summary[:unsupported_municipality]).to eq(1)
  end

  it 'does not mix distinct cities with identical names in different states' do
    acc_ouro_mg = Sales::Account.create!(name: 'Ouro Preto MG', owner: owner, city: 'Belo Horizonte', state: 'MG', country: 'BR')
    acc_sp = Sales::Account.create!(name: 'São Paulo SP', owner: owner, city: 'São Paulo', state: 'SP', country: 'BR')

    acc_ouro_mg.opportunities.create!(name: 'Lead MG', pipeline: pipeline, stage: stage, owner: owner, value_cents: 10_000)
    acc_sp.opportunities.create!(name: 'Lead SP', pipeline: pipeline, stage: stage, owner: owner, value_cents: 20_000)

    scope = Sales::Opportunity.where(sales_account_id: [acc_ouro_mg.id, acc_sp.id])
    result = described_class.call({ all_statuses: true }, scope)

    expect(result[:locations].size).to eq(2)
    states = result[:locations].map { |l| l[:state] }
    expect(states).to contain_exactly('MG', 'SP')
  end
end

