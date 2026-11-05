# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyCtaVisibilityResolver do
  let(:company) do
    double('company', quote_cta_enabled?: true, whatsapp_enabled: true,
           quote_feature_enabled?: false, whatsapp_contact_button_entitled?: false,
           whatsapp_contact_number: '5547999545370', whatsapp_contact_button_enabled?: false,
           cta_visibility_version: 4)
  end

  it 'does not turn preferences into entitlements' do
    result = described_class.new(company).call
    expect(result.dig(:preferences, :quote_cta_enabled)).to eq(true)
    expect(result.dig(:effective, :quote)).to eq(false)
    expect(result.dig(:effective, :whatsapp)).to eq(false)
    expect(result[:version]).to eq(4)
  end

  it 'shows independently entitled channels when enabled' do
    allow(company).to receive(:quote_feature_enabled?).and_return(true)
    allow(company).to receive(:whatsapp_contact_button_entitled?).and_return(true)
    allow(company).to receive(:whatsapp_contact_button_enabled?).and_return(true)
    result = described_class.new(company).call
    expect(result[:effective]).to eq(quote: true, whatsapp: true)
  end
end
