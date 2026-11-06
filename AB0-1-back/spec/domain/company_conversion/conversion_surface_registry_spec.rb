# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyConversion::ConversionSurfaceRegistry do
  it 'registers exactly 24 unique candidate IDs and distinct canonical channels' do
    expect(described_class.validate!).to eq(true)
    expect(described_class.ids.size).to eq(24)
    expect(described_class.ids.uniq.size).to eq(24)
    expect(described_class.all.flat_map { |entry| entry[:channels] }.uniq).to match_array(%w[quote whatsapp])
  end

  it 'does not certify any placement by default' do
    ClimateControl.modify(CONVERSION_CERTIFIED_SURFACE_IDS: '') do
      expect(described_class.certified_ids).to be_empty
    end
  end
end
