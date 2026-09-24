# frozen_string_literal: true

require 'ostruct'
require_relative '../../../app/services/ranking/snapshot_reader'
require_relative '../../../app/models/ranking_run'

RSpec.describe Ranking::SnapshotReader do
  describe '#to_canonical_payload' do
    context 'with legacy CompanyRankingSnapshot format' do
      let(:legacy_record) do
        OpenStruct.new(
          id: 42,
          definition_version: 'organic-performance-v2',
          snapshot_date: Date.new(2026, 9, 24),
          computed_at: Time.utc(2026, 9, 24, 12, 0, 0),
          score: 87.5,
          rank_position: 3,
          population_size: 25,
          percentile: 88.0
        )
      end

      it 'reads legacy fields and maps to canonical payload' do
        reader = described_class.wrap(legacy_record)

        expect(reader.legacy_format?).to be true
        expect(reader.run_id).to eq('legacy-snapshot-42')
        expect(reader.manifest_version).to eq('organic-performance-v2')
        expect(reader.score).to eq(87.5)
        expect(reader.rank_position).to eq(3)
        expect(reader.population_size).to eq(25)
        expect(reader.percentile).to eq(88.0)

        payload = reader.to_canonical_payload
        expect(payload[:legacy_format]).to be true
        expect(payload[:score]).to eq(87.5)
      end
    end

    context 'with canonical RankingRun' do
      let(:manifest) { OpenStruct.new(release_identifier: 'organic-performance-v2@2.0.0') }
      let(:scope) { OpenStruct.new(to_h: { level: 'state', state: 'SC' }) }
      let(:run) do
        RankingRun.new(
          manifest: manifest,
          requested_scope: scope,
          as_of: Time.utc(2026, 9, 24, 0, 0, 0),
          computed_at: Time.utc(2026, 9, 24, 14, 0, 0)
        )
      end

      it 'reads canonical run structure correctly' do
        reader = described_class.wrap(run)

        expect(reader.legacy_format?).to be false
        expect(reader.run_id).to eq(run.run_id)
        expect(reader.manifest_version).to eq('organic-performance-v2@2.0.0')
      end
    end
  end
end
