# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::FreshnessProvider do
  describe '.call' do
    let(:now) { Time.zone.parse('2026-03-05 12:00:00') }

    before do
      Timecop.freeze(now)
      # Simulating a record in analytics_processing_state
      ActiveRecord::Base.connection.execute(
        "DELETE FROM analytics_processing_state WHERE pipeline_name = 'main_aggregation'"
      )
    end

    after do
      Timecop.return
    end

    context 'when the pipeline state exists' do
      before do
        last_processed = now - 10.minutes
        ActiveRecord::Base.connection.execute(
          "INSERT INTO analytics_processing_state (pipeline_name, last_processed_at, updated_at) " \
          "VALUES ('main_aggregation', '#{last_processed.iso8601}', '#{now.iso8601}')"
        )
      end

      it 'returns the correct freshness data' do
        result = described_class.call
        expect(result[:last_aggregated_at]).to be_within(1.second).of(now - 10.minutes)
        expect(result[:data_freshness_seconds]).to eq(600) # 10 minutes
      end
    end

    context 'when the pipeline state is missing' do
      it 'returns nil values safely' do
        result = described_class.call
        expect(result[:last_aggregated_at]).to be_nil
        expect(result[:data_freshness_seconds]).to be_nil
      end
    end
  end
end
