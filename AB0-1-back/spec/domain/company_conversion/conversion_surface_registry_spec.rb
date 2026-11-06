# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyConversion::ConversionSurfaceRegistry do
  def with_modified_env(**values)
    previous = values.transform_keys(&:to_s).to_h { |key, _| [key, ENV[key]] }
    values.each { |key, value| ENV[key.to_s] = value }
    yield
  ensure
    previous.each { |key, value| value.nil? ? ENV.delete(key) : ENV[key] = value }
  end

  it 'registers exactly 24 unique candidate IDs and distinct canonical channels' do
    expect(described_class.validate!).to eq(true)
    expect(described_class.ids.size).to eq(24)
    expect(described_class.ids.uniq.size).to eq(24)
    expect(described_class.all.flat_map { |entry| entry[:channels] }.uniq).to match_array(%w[quote whatsapp])
  end

  it 'does not certify any placement by default' do
    with_modified_env(CONVERSION_CERTIFIED_SURFACE_IDS: '') do
      expect(described_class.certified_ids).to be_empty
    end
  end
end
