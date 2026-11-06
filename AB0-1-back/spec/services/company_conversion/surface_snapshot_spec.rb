# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyConversion::SurfaceSnapshot do
  let(:company) { build_stubbed(:company, status: 'active', moderation_status: 'approved') }

  before do
    allow(company).to receive(:products).and_return(double(exists?: false))
    allow(CompanyCtaVisibilityResolver).to receive(:new).and_return(
      double(call: { effective: { quote: false, whatsapp: false } })
    )
  end

  it 'counts registry candidates but never fabricates observed impressions' do
    ClimateControl.modify(CONVERSION_EVENTS_V2_ENABLED: 'false', CONVERSION_CERTIFIED_SURFACE_IDS: '') do
      snapshot = described_class.new(company: company).call
      expect(snapshot[:summary][:catalog_candidates]).to eq(24)
      expect(snapshot[:summary][:active_quote_points]).to eq(0)
      expect(snapshot[:summary][:observed_surface_count]).to be_nil
      expect(snapshot[:summary][:quote_clicks]).to be_nil
      expect(snapshot[:data_status]).to eq('unavailable')
    end
  end

  it 'rejects invalid periods' do
    expect { described_class.new(company: company, preset: 'all') }.to raise_error(ArgumentError)
  end
end
