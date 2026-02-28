require 'rails_helper'

RSpec.describe Analytics::TrackEventJob, type: :job do
  # Use build_stubbed to avoid database contention
  let(:company) { build_stubbed(:company, id: 123) }
  
  describe '#perform' do
    context 'when job executes successfully' do
      it 'calls TrackEventService with correct parameters' do
        allow(Analytics::TrackEventService).to receive(:call).and_return(
          double(ok: true, error: nil)
        )

        described_class.perform_now(
          company_id: company.id,
          event_type: 'test_event',
          metadata: { test: 'data' },
          user_id: nil,
          tracked_at: Time.current
        )

        expect(Analytics::TrackEventService).to have_received(:call).with(
          company_id: company.id,
          event_type: 'test_event',
          metadata: { test: 'data' },
          user: nil,
          tracked_at: kind_of(Time),
          event_id: nil
        )
      end

      it 'logs successful execution' do
        allow(Analytics::TrackEventService).to receive(:call).and_return(
          double(ok: true, error: nil)
        )
        allow(Rails.logger).to receive(:info)

        described_class.perform_now(
          company_id: company.id,
          event_type: 'test_event'
        )

        expect(Rails.logger).to have_received(:info).with(
          "[Analytics] Event tracked async: test_event for company #{company.id}"
        )
      end
    end

    context 'when TrackEventService returns error' do
      it 'logs the error but does not raise' do
        allow(Analytics::TrackEventService).to receive(:call).and_return(
          double(ok: false, error: 'analytics_disabled_by_flag')
        )
        allow(Rails.logger).to receive(:warn)

        described_class.perform_now(
          company_id: company.id,
          event_type: 'test_event'
        )

        expect(Rails.logger).to have_received(:warn).with(
          "[Analytics] Event tracking failed async: analytics_disabled_by_flag"
        )
      end
    end

    context 'when job encounters exception' do
      it 'logs error and re-raises for retry strategy' do
        allow(Analytics::TrackEventService).to receive(:call).and_raise(
          StandardError, 'Database connection failed'
        )
        allow(Rails.logger).to receive(:error)

        expect {
          described_class.perform_now(
            company_id: company.id,
            event_type: 'test_event'
          )
        }.to raise_error(StandardError, 'Database connection failed')

        expect(Rails.logger).to have_received(:error).with(
          /TrackEventJob failed: StandardError - Database connection failed/
        )
      end
    end

    context 'when user_id provided' do
      let(:user) { build_stubbed(:user, id: 456) }

      it 'finds user and passes to TrackEventService' do
        allow(User).to receive(:find_by).with(id: user.id).and_return(user)
        allow(Analytics::TrackEventService).to receive(:call).and_return(
          double(ok: true, error: nil)
        )

        described_class.perform_now(
          company_id: company.id,
          event_type: 'test_event',
          user_id: user.id
        )

        expect(Analytics::TrackEventService).to have_received(:call).with(
          hash_including(user: user)
        )
      end
    end
  end

  describe 'job configuration' do
    it 'uses analytics queue' do
      expect(described_class.queue_name).to eq('analytics')
    end

    it 'inherits from ApplicationJob' do
      expect(described_class).to be < ApplicationJob
    end
  end
end