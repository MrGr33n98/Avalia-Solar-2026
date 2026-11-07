# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Search::CompanySearchParams do
  it 'normalizes malformed and excessive pagination' do
    value = described_class.new(page: 'invalid', per_page: '9000', sort: 'arbitrary')
    expect(value.page).to eq(1)
    expect(value.per_page).to eq(10)
    expect(value.sort).to eq('recommended')
  end

  it 'preserves valid pagination and a verified filter' do
    value = described_class.new(page: '11', per_page: '24', verified: 'true', state: 'SC')
    expect(value.page).to eq(11)
    expect(value.per_page).to eq(24)
    expect(value.verified).to eq(true)
    expect(value.state).to eq('SC')
  end

  it 'distinguishes missing verification filter from false and ignores product-only sorting' do
    expect(described_class.new({}).verified).to be_nil
    expect(described_class.new(verified: 'false').verified).to eq(false)
    expect(described_class.new(sort: 'price_desc').sort).to eq('recommended')
  end
end
