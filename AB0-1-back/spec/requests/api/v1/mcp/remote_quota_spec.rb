# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP HTTP quota boundary', type: :request do
  let(:preview_key) { 'quota-preview-key-32bytes-or-more-safe-for-tests' }
  let(:redis) { double('Redis') }
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'X-MCP-Preview-Key' => preview_key,
      'MCP-Protocol-Version' => '2025-11-25'
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('preview')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PREVIEW_TOKEN').and_return(preview_key)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return('true')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  def ping(extra_headers = {})
    post '/mcp', params: { jsonrpc: '2.0', id: 1, method: 'ping' }.to_json,
         headers: headers.merge(extra_headers)
  end

  it 'accepts an authenticated request under the quota' do
    allow(redis).to receive(:call).and_return(1)
    ping
    expect(response).to have_http_status(:ok)
  end

  it 'returns 429 and Retry-After for exhausted quota' do
    allow(redis).to receive(:call).and_return(21)
    ping
    expect(response).to have_http_status(:too_many_requests)
    expect(response.headers['Retry-After']).to eq('60')
  end

  it 'fails closed with 503 when quota service is unavailable' do
    allow(redis).to receive(:call).and_raise(IOError)
    ping
    expect(response).to have_http_status(:service_unavailable)
  end

  it 'does not count or allow unauthenticated preview requests' do
    expect(Sidekiq).not_to receive(:redis)
    ping('X-MCP-Preview-Key' => 'invalid-key')
    expect(response).to have_http_status(:not_found)
  end
end
