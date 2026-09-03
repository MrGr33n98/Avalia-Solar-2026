require 'rails_helper'

RSpec.describe Sales::OpportunitiesQuery do
  let(:owner) { create(:user, role: :admin, company: nil) }
  let(:account) { Sales::Account.create!(name: 'Solar Acme', owner: owner) }
  let(:pipeline) { Sales::Pipeline.create!(name: 'B2B', key: "b2b_#{SecureRandom.hex(4)}") }
  let(:stage) { pipeline.stages.create!(name: 'Prospect', key: 'prospect', position: 0, probability: 10) }

  before do
    account.opportunities.create!(name: 'Hot rooftop', pipeline: pipeline, stage: stage, owner: owner, value_cents: 150_000)
    account.opportunities.create!(name: 'Won project', pipeline: pipeline, stage: stage, owner: owner, status: 'won')
  end

  it 'returns only open opportunities by default with pagination and totals' do
    relation = described_class.call(page: 1, per_page: 1)
    expect(relation.count).to eq(1)
    expect(relation.limit(1).first.name).to eq('Hot rooftop')
  end

  it 'filters by safe search and value range' do
    result = described_class.call(q: 'rooftop', value_min: 100_000).to_a
    expect(result.map(&:name)).to eq(['Hot rooftop'])
  end

  it 'supports unassigned owner filter' do
    expect(described_class.call(owner_id: 'unassigned')).to be_empty
  end
end
