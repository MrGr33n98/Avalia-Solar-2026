# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP production activation kill switch', type: :request do
  let(:preview_key) { 'private-test-key-long-enough-for-preview-only-mode' }
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25',
      'X-MCP-Preview-Key' => preview_key
    }
  end

  before do
    allow(Rails.env).to receive(:production?).and_return(true)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PRODUCTION_ENABLED').and_return('false')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('preview')
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('preview')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PREVIEW_TOKEN').and_return(preview_key)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('')
  end

  def ping
    post '/mcp', params: { jsonrpc: '2.0', id: 1, method: 'ping' }.to_json, headers: headers
  end

  it 'remains hidden in production without the separate rollout flag' do
    ping
    expect(response).to have_http_status(:not_found)
  end

  it 'never permits preview-token authentication in production even when rollout flag is set' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PRODUCTION_ENABLED').and_return('true')
    ping
    expect(response).to have_http_status(:not_found)
  end

  it 'does not allow a global transport kill switch to be bypassed by rollout approval' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PRODUCTION_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('false')
    ping
    expect(response).to have_http_status(:not_found)
  end

  it 'does not publish OAuth resource metadata if production rollout is not approved' do
    get '/.well-known/oauth-protected-resource/mcp'
    expect(response).to have_http_status(:not_found)
  end
end
