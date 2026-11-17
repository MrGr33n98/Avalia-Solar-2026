# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::Cursor do
  let(:filters) { { 'query' => 'solar', 'sort' => 'relevance' } }

  it 'round trips an opaque cursor bound to the principal and filters' do
    encoded = described_class.encode(offset: 20, scope: 'list_integrators',
                                     filters: filters, principal: 'user-a')
    expect(encoded).to be_a(String)
    expect(encoded).not_to include('user-a', 'solar')
    expect(described_class.decode(encoded, scope: 'list_integrators',
                                  filters: filters, principal: 'user-a')).to eq(20)
  end

  it 'refuses a cursor replayed with a changed query or identity' do
    encoded = described_class.encode(offset: 20, scope: 'list_integrators',
                                     filters: filters, principal: 'user-a')
    expect do
      described_class.decode(encoded, scope: 'list_integrators',
                             filters: filters, principal: 'user-b')
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
    expect do
      described_class.decode(encoded, scope: 'list_integrators',
                             filters: { 'query' => 'competitor' }, principal: 'user-a')
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
  end

  it 'rejects tampering, excessive offset and malformed encodings' do
    encoded = described_class.encode(offset: 10, scope: 'list_integrators',
                                     filters: filters, principal: 'user-a')
    expect do
      described_class.decode("#{encoded}x", scope: 'list_integrators', filters: filters, principal: 'user-a')
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
    expect(described_class.encode(offset: 501, scope: 'list_integrators',
                                  filters: filters, principal: 'user-a')).to be_nil
    expect do
      described_class.decode('!', scope: 'list_integrators',
                             filters: filters, principal: 'user-a')
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
  end

  it 'starts at offset zero when no cursor is supplied' do
    expect(described_class.decode(nil, scope: 'list_solar_categories',
                                  filters: {}, principal: 'user-a')).to eq(0)
  end
end
