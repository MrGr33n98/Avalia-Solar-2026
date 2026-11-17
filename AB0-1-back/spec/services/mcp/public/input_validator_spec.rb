# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::InputValidator do
  def normalize(name, arguments)
    described_class.normalize(name, arguments)
  end

  it 'accepts a bounded company search with exact known fields' do
    expect(normalize('list_integrators', { 'query' => 'energia', 'limit' => 5, 'state' => 'sc' })).to include(
      'query' => 'energia', 'limit' => 5, 'state' => 'SC', 'sort' => 'relevance'
    )
  end

  it 'rejects unknown, empty, oversize and type-coerced search fields' do
    bad = [
      {}, { 'query' => '' }, { 'query' => 'x' * 121 },
      { 'query' => 'solar', 'tenant_id' => 1 },
      { 'query' => 'solar', 'limit' => '20' }, { 'query' => 'solar', 'limit' => 21 },
      { 'query' => 'solar', 'verified' => 'false' },
      { 'query' => 'solar', 'sort' => 'sponsored' },
      { 'state' => 'S' }
    ]
    bad.each do |args|
      expect { normalize('list_integrators', args) }.to raise_error(described_class::Invalid)
    end
  end

  it 'requires exactly one public company identifier' do
    expect(normalize('show_integrator_profile', { 'slug' => 'solar-teste' })).to eq('slug' => 'solar-teste')
    expect(normalize('get_integrator_reputation', { 'company_id' => 10 })).to eq('company_id' => 10)
    [{}, { 'slug' => 'a', 'company_id' => 1 }, { 'company_id' => '1' }, { 'slug' => '../admin' }].each do |args|
      expect { normalize('show_integrator_profile', args) }.to raise_error(described_class::Invalid)
    end
  end

  it 'validates category filters and refuses unsupported inferred verticals' do
    expect(normalize('list_solar_categories', { 'parent_id' => 3 })).to eq('parent_id' => 3, 'limit' => 10)
    expect { normalize('list_solar_categories', { 'vertical' => 'inferred' }) }.to raise_error(described_class::Invalid)
  end

  it 'requires two or three distinct valid company references for comparison' do
    expect(normalize('compare_integrators', { 'company_ids' => [1, 2] })['company_ids']).to eq([1, 2])
    bad = [
      { 'company_ids' => [1] }, { 'company_ids' => [1, 1] },
      { 'company_ids' => [1, 2, 3, 4] }, { 'company_ids' => [0, 2] },
      { 'company_ids' => [1, 2], 'criteria' => %w[reputation sponsored] },
      { 'company_ids' => [1, 2], 'criteria' => %w[reputation reputation] }
    ]
    bad.each { |args| expect { normalize('compare_integrators', args) }.to raise_error(described_class::Invalid) }
  end

  it 'never accepts internal tools, arbitrary SQL or tenant args' do
    expect { normalize('bulk_lead_export', {}) }.to raise_error(described_class::Invalid)
    expect { normalize('list_integrators', { 'query' => 'solar', 'sql' => 'SELECT * FROM users' }) }.to raise_error(described_class::Invalid)
  end
end
