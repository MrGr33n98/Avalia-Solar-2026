# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::PublicToolRegistry do
  let(:public_names) do
    %w[
      list_integrators
      show_integrator_profile
      list_solar_categories
      get_integrator_reputation
      compare_integrators
    ]
  end

  it 'lists exactly five public, read-only tools without exposing internal dispatcher names' do
    expect(described_class.names).to match_array(public_names)
    expect(described_class.list.map { |tool| tool.fetch('name') }).to eq(public_names)
    expect(described_class.names).not_to include(
      'bulk_lead_export', 'send_outbound_campaign', 'approval_execute',
      'get_leads_summary', 'get_company_dashboard_metrics', 'revenue_search_accounts'
    )
    expect(described_class.find('bulk_lead_export')).to be_nil
    expect(described_class.find('revenue_search_accounts')).to be_nil
  end

  it 'marks all public tools as read-only and declares strictly scoped JSON object inputs' do
    described_class.list.each do |tool|
      expect(tool.fetch('annotations')).to include(
        'readOnlyHint' => true, 'destructiveHint' => false, 'idempotentHint' => true
      )
      expect(tool.fetch('inputSchema')).to include(
        'type' => 'object', 'additionalProperties' => false
      )
      expect(tool).not_to have_key('internal_source')
      expect(tool).to have_key('outputSchema')
    end
  end

  it 'requires at least one search filter and a bounded page size for integrator discovery' do
    schema = described_class.find('list_integrators').fetch('inputSchema')
    expect(schema.fetch('anyOf')).to contain_exactly(
      { 'required' => ['query'] },
      { 'required' => ['category_slug'] },
      { 'required' => ['headquarters_city'] },
      { 'required' => ['state'] }
    )
    expect(schema.dig('properties', 'limit')).to include('minimum' => 1, 'maximum' => 20)
    expect(schema.dig('properties', 'sort', 'enum')).to eq(%w[relevance rating review_count])
  end

  it 'requires exactly one company identifier for profile and reputation' do
    %w[show_integrator_profile get_integrator_reputation].each do |name|
      schema = described_class.find(name).fetch('inputSchema')
      expect(schema.fetch('oneOf')).to contain_exactly(
        { 'required' => ['company_id'] },
        { 'required' => ['slug'] }
      )
    end
  end

  it 'enforces two or three unique company references in comparisons' do
    schema = described_class.find('compare_integrators').fetch('inputSchema')
    refs = schema.dig('properties', 'company_ids')
    expect(schema.fetch('required')).to eq(['company_ids'])
    expect(refs).to include('type' => 'array', 'minItems' => 2, 'maxItems' => 3, 'uniqueItems' => true)
  end

  it 'declares missing review averages as nullable with explicit sample size' do
    schema = described_class.find('get_integrator_reputation').fetch('outputSchema')
    expect(schema.dig('properties', 'data', 'properties', 'average_rating', 'type')).to eq(%w[number null])
    expect(schema.dig('properties', 'data', 'required')).to include('sample_size', 'total_approved')
    expect(schema.fetch('required')).to include('data_as_of', 'limitations', 'source_type')
  end

  it 'does not let consumers mutate the canonical tool definitions' do
    changed = described_class.find('list_integrators')
    changed.fetch('annotations')['readOnlyHint'] = false
    changed.fetch('inputSchema').fetch('properties')['limit']['maximum'] = 1

    original = described_class.find('list_integrators')
    expect(original.dig('annotations', 'readOnlyHint')).to be(true)
    expect(original.dig('inputSchema', 'properties', 'limit', 'maximum')).to eq(20)
  end

  it 'does not dispatch any tool or expose private source metadata via the public list' do
    expect(described_class.internal_source('list_integrators')).to eq('Mcp::SearchCompaniesService')
    expect(described_class.internal_source('approval_execute')).to be_nil
    expect(described_class.list).to all(satisfy { |tool| tool.keys.sort == %w[annotations description inputSchema name outputSchema title] })
  end
end
