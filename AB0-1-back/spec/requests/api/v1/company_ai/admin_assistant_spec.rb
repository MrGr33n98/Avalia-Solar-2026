# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company AI admin API authorization and publication', type: :request do
  let(:user) { create(:user, status: :active, role: :company) }
  let(:company) { create(:company, status: :active) }
  let!(:membership) { create(:company_member, company: company, user: user, role: 'owner') }
  let(:token) do
    JWT.encode({ user_id: user.id, typ: 'access', exp: 1.hour.from_now.to_i, jti: SecureRandom.uuid },
               Rails.application.secret_key_base, 'HS256')
  end
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }
  let(:path) { '/api/v1/company_admin/ai_assistant' }
  let(:definition) do
    {
      start_node_id: 'welcome',
      nodes: [
        { id: 'welcome', type: 'message', text: 'Olá!' },
        { id: 'end', type: 'end' }
      ],
      edges: [{ from: 'welcome', to: 'end' }]
    }
  end

  before do
    allow(CompanyAi::FeatureGate).to receive(:call)
      .and_return(CompanyAi::FeatureGate::Result.new(allowed: true, reason: 'AVAILABLE'))
  end

  it 'rejects unauthenticated writes' do
    patch path, params: { assistant: { greeting: 'Inseguro' }, company_id: company.id }.to_json,
                headers: { 'Content-Type' => 'application/json' }
    expect(response).not_to have_http_status(:ok)
    expect(CompanyAiAssistant.count).to eq(0)
  end

  it 'does not silently redirect a foreign tenant ID to the caller primary company' do
    other = create(:company, status: 'active')
    patch path, params: { assistant: { greeting: 'Alterado' }, company_id: other.id }.to_json, headers: headers
    expect(response).to have_http_status(:forbidden)
    expect(CompanyAiAssistant.count).to eq(0)
  end

  it 'creates a draft and publishes only for an authorized owner' do
    patch path, params: { assistant: { greeting: 'Bem-vindo' }, company_id: company.id }.to_json, headers: headers
    expect(response).to have_http_status(:ok)

    post "#{path}/draft?company_id=#{company.id}", params: { definition: definition }.to_json, headers: headers
    expect(response).to have_http_status(:created)
    version_id = JSON.parse(response.body).fetch('id')

    post "#{path}/versions/#{version_id}/publish?company_id=#{company.id}", headers: headers
    expect(response).to have_http_status(:ok)
    expect(CompanyAiAssistant.find_by!(company_id: company.id).published_workflow.id).to eq(version_id)
    expect(CompanyAiAuditEvent.where(action: 'workflow_published', company_id: company.id).count).to eq(1)
  end

  it 'does not let an editor publish a workflow' do
    assistant = CompanyAiAssistant.create!(company: company)
    version = assistant.workflow_versions.create!(version_number: 1, status: 'draft', definition: definition.as_json)
    second_owner = create(:user, status: :active, role: :company)
    create(:company_member, user: second_owner, company: company, role: 'owner')
    membership.update!(role: 'editor')

    post "#{path}/versions/#{version.id}/publish?company_id=#{company.id}", headers: headers
    expect(response).to have_http_status(:forbidden)
    expect(version.reload.status).to eq('draft')
  end
end
