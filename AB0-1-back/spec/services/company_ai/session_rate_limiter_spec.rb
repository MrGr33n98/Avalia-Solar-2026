# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::SessionRateLimiter do
  it 'denies invalid origin or company without creating counters' do
    expect(described_class.allowed?(ip: nil, company_id: 10)).to be(false)
    expect(described_class.allowed?(ip: '127.0.0.1', company_id: nil)).to be(false)
  end

  it 'accepts ten sessions per minute per hashed company/IP key and denies the eleventh' do
    allow(Rails.cache).to receive(:increment).and_return(*(1..11).to_a)
    expect(10.times.map { described_class.allowed?(ip: '127.0.0.1', company_id: 5) }).to all(eq(true))
    expect(described_class.allowed?(ip: '127.0.0.1', company_id: 5)).to be(false)
  end

  it 'fails closed when shared cache is unavailable' do
    allow(Rails.cache).to receive(:increment).and_raise(Redis::CannotConnectError)
    expect(described_class.allowed?(ip: '127.0.0.1', company_id: 5)).to be(false)
  end
end
