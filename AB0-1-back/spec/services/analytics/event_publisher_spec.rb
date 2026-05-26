require 'rails_helper'

RSpec.describe Analytics::EventPublisher do
  let(:redis_mock) { instance_double(Redis) }
  
  before do
    allow(Redis).to receive(:current).and_return(redis_mock)
    allow(redis_mock).to receive(:set).and_return(true)
    allow(Analytics::BigQueryBatchFlushJob).to receive(:perform_later)
  end

  describe '.publish' do
    context 'when redis is available' do
      it 'publishes anonymized payload to stream and schedules flush job' do
        expect(redis_mock).to receive(:xadd).with(
          described_class::STREAM_KEY,
          hash_including(
            event_type: 'test_event',
            payload: a_string_matching(/"email":"\[REDACTED\]"/)
          )
        )
        
        expect(Analytics::BigQueryBatchFlushJob).to receive(:perform_later)

        described_class.publish('test_event', { email: 'felipe@test.com' }, user_id: 1)
      end
    end

    context 'when redis is down (fail-safe)' do
      it 'rescues exception and does not raise error to the client' do
        allow(redis_mock).to receive(:xadd).and_raise(Redis::CannotConnectError.new('Redis down'))
        expect(Rails.logger).to receive(:error).with(/\[Analytics::EventPublisher\] Falha ao publicar evento test_event/)
        
        expect {
          described_class.publish('test_event', { info: 'test' })
        }.not_to raise_error
      end
    end
  end
end
