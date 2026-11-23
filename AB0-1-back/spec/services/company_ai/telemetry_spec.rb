# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::Telemetry do
  let(:company) { create(:company, status: 'active') }
  let(:session) do
    ChatSession.create!(company:, vertical: 'company_ai', mode: 'bot_only', inbox_status: 'archived')
  end

  it 'grava somente fatos operacionais no outbox' do
    payload = described_class.record(
      event: 'message.completed', session:, request_id: 'request-123', duration_ms: 42,
      outcome: 'completed', metadata: { response_model: 'test-model', content: 'não deve persistir' }
    )

    expect(payload).to include(session_id: session.id, company_id: company.id, duration_ms: 42, outcome: 'completed')
    event = DomainEvent.order(:id).last
    expect(event.event_type).to eq('company_ai.message.completed')
    expect(event.payload).to include('session_id' => session.id, 'request_id' => 'request-123')
    expect(event.payload.to_json).not_to include('não deve persistir')
  end

  it 'descarta labels arbitrários e não falha a requisição' do
    described_class.record(
      event: 'unknown', session:, request_id: "bad value\nwith content", duration_ms: 1,
      outcome: 'unknown', metadata: { response_model: 'safe-model', action_type: 'open_quote_wizard' }
    )

    event = DomainEvent.order(:id).last
    expect(event.event_type).to eq('company_ai.message.failed')
    expect(event.payload['request_id']).to be_nil
    expect(event.payload['outcome']).to eq('error')
  end
end
