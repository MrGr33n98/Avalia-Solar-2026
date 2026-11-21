# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::UsageLedger do
  let(:company) { create(:company) }
  let(:assistant) { CompanyAiAssistant.create!(company: company) }

  it 'reserves only once per request ID and enforces the monthly cap' do
    first = described_class.reserve!(assistant: assistant, request_id: 'request_001', monthly_limit: 1)
    again = described_class.reserve!(assistant: assistant, request_id: 'request_001', monthly_limit: 1)
    expect(again.id).to eq(first.id)
    expect { described_class.reserve!(assistant: assistant, request_id: 'request_002', monthly_limit: 1) }
      .to raise_error(described_class::QuotaExceeded)
  end

  it 'settles exactly once and cannot reopen a charged reservation' do
    entry = described_class.reserve!(assistant: assistant, request_id: 'request_003', monthly_limit: 2)
    described_class.settle!(entry: entry, input_tokens: 100, output_tokens: 50, cost_usd: '0.001', model: 'test')
    described_class.settle!(entry: entry, input_tokens: 100, output_tokens: 50, cost_usd: '0.001', model: 'test')
    expect(entry.reload.state).to eq('settled')
    expect(entry.cost_usd.to_d).to eq(BigDecimal('0.001'))
  end
end
