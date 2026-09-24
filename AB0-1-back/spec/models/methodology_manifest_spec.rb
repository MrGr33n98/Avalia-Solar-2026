# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MethodologyManifest do
  describe '.organic_v2' do
    it 'creates an immutable published manifest with parameter digest' do
      manifest = described_class.organic_v2

      expect(manifest.manifest_id).to eq('organic-performance-v2')
      expect(manifest.release_version).to eq('2.0.0')
      expect(manifest.release_identifier).to eq('organic-performance-v2@2.0.0')
      expect(manifest.published?).to be true
      expect(manifest.parameter_digest).to be_present
      expect(manifest.parameter_digest.length).to eq(64) # SHA256
      expect(manifest.components.size).to eq(4)
      expect(manifest.component('trust_score')[:weight]).to eq(0.35)
    end

    it 'ensures deterministic parameter digest for identical components' do
      m1 = described_class.organic_v2
      m2 = described_class.organic_v2

      expect(m1.parameter_digest).to eq(m2.parameter_digest)
    end
  end
end
