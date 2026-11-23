# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company AI messages API', type: :request do
  let(:company) { create(:company, status: 'active') }
  let(:assistant) { CompanyAiAssistant.create!(company: company, greeting: 'Olá!') }
  let(:definition) do
    {
      'start_node_id' => 'welcome',
      'nodes' => [
        { 'id' => 'welcome', 'type' => 'message', 'text' => 'Olá' },
        { 'id' => 'end', 'type' => 'end' }
      ],
      'edges' => [{ 'from' => 'welcome', 'to' => 'end' }]
    }
  end
  let(:version) do
    assistant.workflow_versions.create!(version_number: 1, status: 'published', definition: definition,
                                        published_at: Time.current)
  end
  let(:session) do
    ChatSession.create!(company: company, vertical: 'company_ai', mode: 'bot_only', inbox_status: 'archived',
                        metadata: { 'company_ai_current_node_id' => 'welcome',
                                    'company_ai_workflow_version_id' => version.id })
  end

  before do
    assistant.update!(active_version_id: version.id, enabled: true)
    allow(CompanyAi::FeatureGate).to receive(:call)
      .and_return(CompanyAi::FeatureGate::Result.new(allowed: true, reason: 'AVAILABLE'))
    allow(CompanyAi::SessionRateLimiter).to receive(:allowed?).and_return(true)
  end

  it 'aceita somente o token assinado da própria sessão' do
    token = Chat::SessionAccessToken.generate(session)

    post "/api/v1/companies/#{company.id}/ai_sessions/#{session.id}/messages",
         params: { content: 'Olá', client_message_id: 'client_101' },
         headers: { 'X-Chat-Session-Token' => token }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('assistant_message', 'content')).to eq('Olá')
  end

  it 'não permite usar a sessão em outro tenant' do
    other_company = create(:company, status: 'active')
    token = Chat::SessionAccessToken.generate(session)

    post "/api/v1/companies/#{other_company.id}/ai_sessions/#{session.id}/messages",
         params: { content: 'Olá', client_message_id: 'client_102' },
         headers: { 'X-Chat-Session-Token' => token }

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.fetch('code')).to eq('TENANT_SCOPE_MISMATCH')
  end
end
