# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::TrackEventService do
  let(:company) { create(:company) }
  let(:event_type) { 'test_event' }
  let(:metadata) { { 'required_key' => 'value' } }

  describe 'Event Contract Validation' do
    before do
      # Mock EventRegistry
      allow(Analytics::EventRegistry).to receive(:fetch).with(event_type).and_return({
        'required_keys' => '["required_key"]'
      })
    end

    context 'when contract is valid' do
      it 'processes the event successfully' do
        result = described_class.call(company_id: company.id, event_type: event_type, metadata: metadata)
        expect(result.ok).to be true
      end
    end

    context 'when contract is invalid (missing keys)' do
      let(:metadata) { { 'other_key' => 'value' } }

      it 'logs an ingest error in database and proceeds (Soft Mode by default)' do
        # Clear existing errors for determinism
        ActiveRecord::Base.connection.execute("DELETE FROM event_ingest_errors")
        
        result = described_class.call(company_id: company.id, event_type: event_type, metadata: metadata)
        
        expect(result.ok).to be true
        
        # Verify side effect in DB
        error_count = ActiveRecord::Base.connection.select_value("SELECT COUNT(*) FROM event_ingest_errors").to_i
        expect(error_count).to eq(1)
        
        error_reason = ActiveRecord::Base.connection.select_value("SELECT error_reason FROM event_ingest_errors LIMIT 1")
        expect(error_reason).to include('Missing required keys')
      end

      it 'blocks the event when G4_ANALYTICS_STRICT_MODE is true (Hard Mode)' do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_STRICT_MODE').and_return('true')
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_ENABLED').and_return('true')

        result = described_class.call(company_id: company.id, event_type: event_type, metadata: metadata)
        expect(result.ok).to be false
        expect(result.error).to include('contract_violation')
      end
    end

    context 'when strict mode receives an unknown event' do
      it 'rejects the event' do
        allow(Analytics::EventRegistry).to receive(:fetch).with(event_type).and_return(nil)
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_STRICT_MODE').and_return('true')
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_ENABLED').and_return('true')

        result = described_class.call(company_id: company.id, event_type: event_type, metadata: metadata)

        expect(result.ok).to be false
        expect(result.error).to include('UNKNOWN_EVENT')
      end
    end
  end
end
