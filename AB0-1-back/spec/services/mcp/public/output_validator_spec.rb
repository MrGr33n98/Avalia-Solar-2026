# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::OutputValidator do
  let(:safe_payload) do
    {
      schema_version: '1.0.0',
      data_as_of: Time.current.utc.iso8601,
      source_type: 'company_declared',
      data: { integrators: [], next_cursor: nil },
      limitations: ['Sede não implica cobertura.']
    }
  end

  it 'accepts a complete public envelope without exposing additional fields' do
    result = described_class.validate!(name: 'list_integrators', payload: safe_payload)
    expect(result.fetch('schema_version')).to eq('1.0.0')
    expect(result.fetch('data').fetch('integrators')).to eq([])
  end

  it 'rejects private tokens, buyer details or reviewer identifiers in nested output' do
    examples = [
      { integrators: [{ id: 1, access_token: 'PRIVATE' }] },
      { integrators: [{ id: 1, buyer_intent: { user_id: 9 } }] },
      { integrators: [{ id: 1, reviewer_email: 'private@example.invalid' }] }
    ]
    examples.each do |unsafe|
      payload = safe_payload.merge(data: unsafe)
      expect do
        described_class.validate!(name: 'list_integrators', payload: payload)
      end.to raise_error(described_class::Invalid)
    end
  end

  it 'rejects missing, extra or oversized response fields' do
    invalid = [
      safe_payload.except(:schema_version),
      safe_payload.merge(execution_token: 'PRIVATE'),
      safe_payload.merge(data: {}),
      safe_payload.merge(limitations: ['X' * 501]),
      safe_payload.merge(data: { integrators: [{ description: 'X' * 65_536 }] })
    ]
    invalid.each do |payload|
      expect { described_class.validate!(name: 'list_integrators', payload: payload) }.to raise_error(described_class::Invalid)
    end
  end

  it 'rejects impossible timestamps or unknown tool names' do
    expect do
      described_class.validate!(name: 'list_integrators', payload: safe_payload.merge(data_as_of: 'not a date'))
    end.to raise_error(described_class::Invalid)
    expect do
      described_class.validate!(name: 'bulk_lead_export', payload: safe_payload)
    end.to raise_error(described_class::Invalid)
  end
end
