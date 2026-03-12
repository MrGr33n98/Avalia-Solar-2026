require 'rails_helper'

RSpec.describe Analytics::TrackEventService do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }

  describe '.call kill switch behavior' do
    context 'when kill switch is active (G4_ANALYTICS_ENABLED=false)' do
      it 'returns success with analytics_disabled_by_flag error and logs' do
        allow(Rails.env).to receive(:test?).and_return(false)
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_ENABLED').and_return('false')
        allow(Rails.logger).to receive(:info)

        result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/companies/foo' }
        )

        expect(result.ok).to be(true)
        expect(result.error).to eq('analytics_disabled_by_flag')
        expect(Rails.logger).to have_received(:info).with("[G4-Analytics] Analytics disabled by flag G4_ANALYTICS_ENABLED=false")
      end
    end

    context 'when the flag is absent in non-test environments' do
      it 'keeps analytics ingestion enabled by default' do
        allow(Rails.env).to receive(:test?).and_return(false)
        allow(ENV).to receive(:[]).with('G4_ANALYTICS_ENABLED').and_return(nil)

        result = nil
        expect do
          result = described_class.call(
            company_id: company.id,
            event_type: 'profile_view',
            metadata: { path: '/companies/foo' }
          )
        end.to change(AnalyticsEvent, :count).by(1)

        expect(result.ok).to be(true)
        expect(result.error).to be_nil
      end
    end
  end

  describe '.call global events without company_id' do
    it 'accepts page_view without persisting an analytics event' do
      result = nil

      expect do
        result = described_class.call(
          company_id: nil,
          event_type: 'page_view',
          metadata: { path: '/categories/energia-solar' }
        )
      end.not_to change(AnalyticsEvent, :count)

      aggregate_failures do
        expect(result.ok).to be(true)
        expect(result.event).to be_nil
        expect(result.error).to eq('global_event_without_company_skipped')
      end
    end

    it 'accepts web_vital without persisting an analytics event' do
      result = nil

      expect do
        result = described_class.call(
          company_id: nil,
          event_type: 'web_vital',
          metadata: { path: '/categories/energia-solar' }
        )
      end.not_to change(AnalyticsEvent, :count)

      aggregate_failures do
        expect(result.ok).to be(true)
        expect(result.event).to be_nil
        expect(result.error).to eq('global_event_without_company_skipped')
      end
    end
  end

  describe '.call basic functionality' do
    context 'when tracking events with valid company_id' do
      it 'accepts the event and processes normally' do
        result = nil
        expect do
          result = described_class.call(
            company_id: company.id,
            event_type: 'profile_view',
            metadata: { path: '/companies/foo' }
          )
        end.to change(AnalyticsEvent, :count).by(1)

        expect(result.ok).to be(true)
        expect(result.error).to be_nil
        expect(result.event).to be_present
        expect(result.event.event_type).to eq('profile_view')
      end
    end

    context 'when event_type is missing' do
      it 'returns error for missing event type' do
        result = described_class.call(
          company_id: company.id,
          event_type: '',
          metadata: { path: '/test' }
        )

        expect(result.ok).to be(false)
        expect(result.error).to eq('event_type missing')
      end
    end

    context 'when non-global event lacks company_id' do
      it 'returns error for missing company_id' do
        result = described_class.call(
          company_id: nil,
          event_type: 'profile_view',
          metadata: { path: '/test' }
        )

        expect(result.ok).to be(false)
        expect(result.error).to eq('company_id missing for event')
      end
    end
  end

  describe '.call duplicate event handling' do
    context 'when same event_id is submitted twice' do
      let(:event_id) { 'test_event_123' }

      it 'accepts first event and detects duplicate on second with database validation' do
        # Skip if analytics_event_dedup table doesn't exist
        skip 'analytics_event_dedup table not available' unless ActiveRecord::Base.connection.table_exists?('analytics_event_dedup')

        initial_event_count = AnalyticsEvent.count

        # First call should succeed
        first_result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/test' },
          event_id: event_id
        )

        # Verify first event created exactly one dedup record
        dedup_count_after_first = ActiveRecord::Base.connection.execute(
          "SELECT COUNT(*) FROM analytics_event_dedup WHERE event_id = '#{event_id}'"
        ).first.values.first

        # Second call with same event_id should detect duplicate
        second_result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/test' },
          event_id: event_id
        )

        final_event_count = AnalyticsEvent.count

        # Verify still only one dedup record exists
        dedup_count_after_second = ActiveRecord::Base.connection.execute(
          "SELECT COUNT(*) FROM analytics_event_dedup WHERE event_id = '#{event_id}'"
        ).first.values.first

        aggregate_failures do
          expect(first_result.ok).to be(true)
          expect(first_result.error).to be_nil
          expect(dedup_count_after_first).to eq(1)
          
          expect(second_result.ok).to be(true)
          expect(second_result.error).to eq('duplicate_event')
          expect(dedup_count_after_second).to eq(1)  # Still only 1 record
          expect(final_event_count - initial_event_count).to eq(1)
        end
      end
    end

    context 'when testing SQLite adapter raw_connection.changes behavior' do
      let(:event_id) { 'sqlite_test_event_456' }

      it 'validates SQLite INSERT OR IGNORE + raw_connection.changes pattern' do
        # Skip if analytics_event_dedup table doesn't exist or not SQLite
        skip 'analytics_event_dedup table not available' unless ActiveRecord::Base.connection.table_exists?('analytics_event_dedup')
        skip 'not SQLite adapter' unless ActiveRecord::Base.connection.adapter_name.downcase.include?('sqlite')

        # Clean any previous test data
        ActiveRecord::Base.connection.execute("DELETE FROM analytics_event_dedup WHERE event_id = '#{event_id}'")

        # Manual replication of ensure_unique_event! SQLite branch for validation
        connection = ActiveRecord::Base.connection
        
        # First insert should report 1 changed row
        connection.execute("INSERT OR IGNORE INTO analytics_event_dedup (event_id, inserted_at) VALUES ('#{event_id}', '#{Time.current.iso8601}')")
        first_changes = connection.raw_connection.changes

        # Second insert should report 0 changed rows (ignored due to conflict)
        connection.execute("INSERT OR IGNORE INTO analytics_event_dedup (event_id, inserted_at) VALUES ('#{event_id}', '#{Time.current.iso8601}')")
        second_changes = connection.raw_connection.changes

        # Verify expected behavior
        aggregate_failures do
          expect(first_changes).to eq(1)
          expect(second_changes).to eq(0)
        end

        # Clean up
        ActiveRecord::Base.connection.execute("DELETE FROM analytics_event_dedup WHERE event_id = '#{event_id}'")
      end
    end
  end

  describe '.call error handling' do
    context 'when service encounters an exception in class method' do
      before do
        allow_any_instance_of(described_class).to receive(:call).and_raise(StandardError, 'Database connection failed')
        allow(Rails.logger).to receive(:error)
      end

      it 'returns sanitized error without exposing internal details' do
        result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/test' }
        )

        aggregate_failures do
          expect(result.ok).to be(false)
          expect(result.error).to eq('analytics_service_error')
          expect(Rails.logger).to have_received(:error).with(/Critical Failure in Service/)
        end
      end
    end

    context 'when service encounters an exception in instance method flow' do
      before do
        allow_any_instance_of(described_class).to receive(:persist_platform_event!).and_raise(StandardError, 'Database write failed')
        allow(Rails.logger).to receive(:error)
      end

      it 'returns sanitized error from internal rescue without exposing exception details' do
        result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/test' }
        )

        aggregate_failures do
          expect(result.ok).to be(false)
          expect(result.error).to eq('analytics_processing_error')
          expect(result.error).not_to include('Database write failed')
          expect(Rails.logger).to have_received(:error).with(/TrackEventService error/)
        end
      end
    end

    context 'when ensure_unique_event encounters real database error' do
      before do
        allow(ActiveRecord::Base.connection).to receive(:table_exists?).and_return(true)
        # Stub the low-level execute method to simulate real SQL error
        allow(ActiveRecord::Base.connection).to receive(:execute).and_call_original
        allow(ActiveRecord::Base.connection).to receive(:execute).with(/INSERT.*analytics_event_dedup/).and_raise(ActiveRecord::StatementInvalid, 'Column event_id does not exist')
        allow(Rails.logger).to receive(:error)
      end

      it 'propagates real database error from within ensure_unique_event implementation' do
        result = described_class.call(
          company_id: company.id,
          event_type: 'profile_view',
          metadata: { path: '/test' },
          event_id: 'test_real_error'
        )

        aggregate_failures do
          expect(result.ok).to be(false)
          expect(result.error).to eq('analytics_processing_error')
          expect(result.error).not_to eq('duplicate_event')
          expect(Rails.logger).to have_received(:error).with(/TrackEventService error/)
        end
      end
    end
  end
end
