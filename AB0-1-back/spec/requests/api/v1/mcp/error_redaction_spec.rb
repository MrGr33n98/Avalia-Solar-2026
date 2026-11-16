# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP tool error redaction', type: :request do
  before { allow(Rails.cache).to receive(:increment).and_return(1) }

  it 'returns a generic 500 with request ID without leaking exception details' do
    sensitive_error = StandardError.new('internal-secret-token=DO_NOT_EXPOSE /srv/app/private/file.rb:17')
    allow(::Mcp::SearchCompaniesService).to receive(:new).and_raise(sensitive_error)

    post '/api/v1/mcp/tools/search_companies',
         params: { arguments: { query: 'energia solar' } },
         as: :json

    expect(response).to have_http_status(:internal_server_error)
    payload = response.parsed_body
    expect(payload).to include('ok' => false, 'tool' => 'search_companies')
    expect(payload.fetch('error')).to eq(
      'code' => 'internal_error',
      'message' => 'Erro interno ao executar a ferramenta.'
    )
    expect(payload.dig('meta', 'request_id')).to be_present
    expect(payload.dig('meta', 'execution_ms')).to be_a(Integer)
    expect(response.body).not_to include('DO_NOT_EXPOSE', 'private/file.rb', 'backtrace', 'StandardError')
  end

  it 'does not log raw exception messages from a failed public tool' do
    sensitive_error = StandardError.new('AUTHORIZATION=DO_NOT_LOG')
    allow(::Mcp::SearchCompaniesService).to receive(:new).and_raise(sensitive_error)
    errors = []
    allow(Rails.logger).to receive(:error) { |message| errors << message.to_s }

    post '/api/v1/mcp/tools/search_companies',
         params: { arguments: { query: 'energia solar' } },
         as: :json

    mcp_events = errors.grep(/\[MCP\]/)
    expect(mcp_events).not_to be_empty
    expect(mcp_events.join).to include('error=StandardError', 'request_id=')
    expect(mcp_events.join).not_to include('DO_NOT_LOG', 'AUTHORIZATION=')
  end

  it 'preserves the documented response for unknown tools' do
    post '/api/v1/mcp/tools/not_a_real_tool', params: { arguments: {} }, as: :json

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body.dig('error', 'code')).to eq('unknown_tool')
  end
end
