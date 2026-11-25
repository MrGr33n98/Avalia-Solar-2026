# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Locations::BrLocations do
  describe '.revision' do
    it 'uses a SHA256 digest of the official location data file' do
      expected_revision = Digest::SHA256.file(described_class::DATA_PATH).hexdigest

      expect(described_class.revision).to eq(expected_revision)
    end
  end

  describe '.warmup!' do
    it 'builds the in-memory index without accessing Active Record' do
      expect(ActiveRecord::Base).not_to receive(:connection)

      result = described_class.warmup!

      expect(result).to include(
        revision: described_class.revision,
        state_count: described_class.states.length,
        city_count: described_class.states.sum { |state| described_class.cities_for(state['acronym']).length }
      )
    end
  end
end
