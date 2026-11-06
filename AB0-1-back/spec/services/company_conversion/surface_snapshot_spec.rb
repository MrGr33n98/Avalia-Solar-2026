# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyConversion::SurfaceSnapshot do
  def with_modified_env(**values)
    previous = values.transform_keys(&:to_s).to_h { |key, _| [key, ENV[key]] }
    values.each { |key, value| ENV[key.to_s] = value }
    yield
  ensure
    previous.each { |key, value| value.nil? ? ENV.delete(key) : ENV[key] = value }
  end

  let(:company) { build_stubbed(:company, status: 'active', moderation_status: 'approved') }

  before do
    allow(company).to receive(:products).and_return(double(exists?: false))
    allow(CompanyCtaVisibilityResolver).to receive(:new).and_return(
      double(call: { effective: { quote: false, whatsapp: false } })
    )
  end

  it 'counts registry candidates but never fabricates observed impressions' do
    with_modified_env(CONVERSION_EVENTS_V2_ENABLED: 'false', CONVERSION_CERTIFIED_SURFACE_IDS: '') do
      snapshot = described_class.new(company: company).call
      expect(snapshot[:summary][:catalog_candidates]).to eq(24)
      expect(snapshot[:summary][:active_quote_points]).to eq(0)
      expect(snapshot[:summary][:applicable_surfaces]).to eq(0)
      expect(snapshot[:summary][:observed_surface_count]).to be_nil
      expect(snapshot[:summary][:quote_clicks]).to be_nil
      expect(snapshot[:data_status]).to eq('unavailable')
    end
  end

  it 'counts paid eligible surface groups even when uncertified, without declaring them live' do
    allow(CompanyCtaVisibilityResolver).to receive(:new).and_return(
      double(call: { effective: { quote: true, whatsapp: false } })
    )
    with_modified_env(CONVERSION_EVENTS_V2_ENABLED: 'false', CONVERSION_CERTIFIED_SURFACE_IDS: '') do
      snapshot = described_class.new(company: company).call
      expect(snapshot[:summary][:applicable_surfaces]).to be > 0
      expect(snapshot[:summary][:active_quote_points]).to eq(0)
      expect(snapshot[:summary][:impressions]).to be_nil
    end
  end

  it 'rejects invalid periods' do
    expect { described_class.new(company: company, preset: 'all') }.to raise_error(ArgumentError)
  end
end
