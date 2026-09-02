require 'rails_helper'

RSpec.describe Sales::QuoteLifecycle do
  before { allow(Sales::AuditRecorder).to receive(:call) }
  it 'permite envio e registra evento' do
    quote = instance_double(Sales::Quote, status: 'draft', events: double(create!: true))
    allow(quote).to receive(:update!)
    expect(described_class.call(quote: quote, to: 'sent')).to eq(quote)
    expect(quote).to have_received(:update!).with(hash_including(status: 'sent'))
  end

  it 'rejeita salto de estado' do
    quote = instance_double(Sales::Quote, status: 'draft')
    expect { described_class.call(quote: quote, to: 'accepted') }.to raise_error(ArgumentError)
  end
end
