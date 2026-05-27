require 'rails_helper'

RSpec.describe IdempotencyMiddleware do
  class IdempotencyEnumerableBody
    attr_reader :closed

    def initialize(chunks)
      @chunks = chunks
      @closed = false
    end

    def each(&block)
      @chunks.each(&block)
    end

    def close
      @closed = true
    end
  end

  let(:cache) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(Rails).to receive(:cache).and_return(cache)
    Rails.cache.clear
  end

  describe '#call' do
    it 'caches successful checkout responses from Rack bodies that only implement each' do
      calls = 0
      original_body = IdempotencyEnumerableBody.new(['{"checkout_url":"https://checkout.stripe.com/pay/session"}'])
      app = lambda do |_env|
        calls += 1
        [200, { 'Content-Type' => 'application/json' }, original_body]
      end

      middleware = described_class.new(app)
      env = Rack::MockRequest.env_for(
        '/api/v1/billing/checkout',
        method: 'POST',
        'HTTP_IDEMPOTENCY_KEY' => 'checkout-key-123456'
      )

      status, headers, body = middleware.call(env)

      expect(status).to eq(200)
      expect(headers['Content-Type']).to eq('application/json')
      expect(body.join).to include('checkout_url')
      expect(original_body.closed).to be(true)

      replay_status, replay_headers, replay_body = middleware.call(env)

      expect(calls).to eq(1)
      expect(replay_status).to eq(200)
      expect(replay_headers['X-Idempotent-Replay']).to eq('true')
      expect(replay_body.join).to include('checkout_url')
    end
  end
end
