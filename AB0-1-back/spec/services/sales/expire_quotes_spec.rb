require 'rails_helper'

RSpec.describe Sales::ExpireQuotes do
  it 'expira propostas enviadas após a data limite' do
    expired = instance_double(Sales::Quote, status: 'sent')
    relation = instance_double(ActiveRecord::Relation)
    allow(Sales::Quote).to receive(:where).and_return(relation)
    allow(relation).to receive(:where).and_return(relation)
    allow(relation).to receive(:find_each).and_yield(expired)
    allow(Sales::QuoteLifecycle).to receive(:call)

    described_class.call(now: Date.new(2026, 9, 2))

    expect(Sales::QuoteLifecycle).to have_received(:call).with(quote: expired, to: 'expired')
  end
end
