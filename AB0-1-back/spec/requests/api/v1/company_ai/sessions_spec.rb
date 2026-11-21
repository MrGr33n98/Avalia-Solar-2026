# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company AI contextual session API', type: :request do
  let(:company) { create(:company, status: 'active') }
  let(:definition) { {
    'start_node_id' => 'welcome',
    'nodes' => [
      { 'id' => 'welcome', 'type' => 'message', 'text' => 'Olá' },
      { 'id' => 'finish', 'type' => 'end' }
    ],
    'edges' => [{ 'from' => 'welcome', 'to' => 'finish' }]
  } }

  it 'rejects public sessions without the global rollout entitlement' do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('COMPANY_AI_ENABLED', 'false').and_return('false')
    post "/api/v1/companies/#{company.id}/ai_sessions"
    expect(response).to have_http_status(:forbidden)
    expect(ChatSession.where(company_id: company.id, vertical: 'company_ai')).to be_empty
  end

  it 'server-binds the company, published workflow and signed access token' do
    assistant = CompanyAiAssistant.create!(company: company, greeting: 'Bem-vindo!')
    version = assistant.workflow_versions.create!(version_number: 1, status: 'published',
                                                   definition: definition, published_at: Time.current)
    assistant.update!(active_version_id: version.id, enabled: true)
    allow(CompanyAi::FeatureGate).to receive(:call)
      .and_return(CompanyAi::FeatureGate::Result.new(allowed: true, reason: 'AVAILABLE'))

    post "/api/v1/companies/#{company.id}/ai_sessions", params: { company_id: -9999, page_url: '/companies/another' }
    expect(response).to have_http_status(:created)
    result = response.parsed_body
    session = ChatSession.find(result.fetch('session_id'))
    expect(session.company_id).to eq(company.id)
    expect(session.metadata.fetch('company_ai_workflow_version_id')).to eq(version.id)
    expect(Chat::SessionAccessToken.verify(result.fetch('access_token'), session: session)).to be_present
    expect(result.dig('initial_message', 'content')).to eq('Bem-vindo!')
  end
end
