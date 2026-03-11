require 'rails_helper'
require 'ostruct'

RSpec.describe WebhookDeliveryJob, type: :job do
  let(:webhook) do
    create(
      :company_webhook,
      secret_key: 'a' * 64,
      events: ['intent.hot'],
      url: 'https://hooks.example.com/intent'
    )
  end
  let(:payload) do
    {
      intent_score_id: 'score-1',
      company_id: webhook.company_id,
      total_score: 88
    }
  end

  it 'posts a signed JSON payload to the subscribed webhook endpoint' do
    request_headers = {}
    request_options = OpenStruct.new
    request_body = nil

    allow(Faraday).to receive(:post) do |url, &block|
      expect(url).to eq('https://hooks.example.com/intent')

      request = OpenStruct.new(headers: request_headers, options: request_options, body: nil)
      block.call(request)
      request_body = request.body

      instance_double(Faraday::Response, status: 200)
    end

    described_class.perform_now(webhook.id, 'intent.hot', payload)

    parsed_body = JSON.parse(request_body)

    expect(parsed_body['event']).to eq('intent.hot')
    expect(parsed_body['data']).to include(
      'intent_score_id' => 'score-1',
      'total_score' => 88
    )
    expect(parsed_body['timestamp']).to be_present
    expect(request_headers['Content-Type']).to eq('application/json')
    expect(request_headers['X-Webhook-Event']).to eq('intent.hot')
    expect(request_headers['X-Webhook-Signature']).to eq(webhook.sign_payload(request_body))
    expect(request_options.timeout).to eq(10)
    expect(request_options.open_timeout).to eq(5)
  end

  it 'raises when the remote endpoint responds with an error' do
    allow(Faraday).to receive(:post).and_return(instance_double(Faraday::Response, status: 500))

    expect do
      described_class.perform_now(webhook.id, 'intent.hot', payload)
    end.to raise_error(RuntimeError, 'Webhook delivery failed: HTTP 500')
  end
end
