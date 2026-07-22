# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Live Inbox API', type: :request do
  let(:company) { create(:company) }
  let(:agent) { create(:user, role: 'company', company: nil, approved_by_admin: true) }
  let(:session) { create(:chat_session, company: company, inbox_status: 'waiting_agent', mode: 'hybrid') }

  before do
    create(:company_member, company: company, user: agent, status: 'active')
    create(:chat_lead, chat_session: session, assigned_company: company)
    create(:chat_message, chat_session: session, role: 'user', content: 'Quero um orçamento')
  end

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  it 'lists only sessions belonging to the active company member' do
    other = create(:chat_session, company: create(:company))

    get '/api/v1/inbox/sessions', params: { company_id: company.id }, headers: auth_headers_for(agent)

    expect(response).to have_http_status(:ok)
    ids = JSON.parse(response.body).fetch('sessions').pluck('id')
    expect(ids).to include(session.id)
    expect(ids).not_to include(other.id)
  end

  it 'loads the latest conversation history' do
    get "/api/v1/inbox/sessions/#{session.id}/messages",
        params: { company_id: company.id },
        headers: auth_headers_for(agent)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('messages').last.fetch('content')).to eq('Quero um orçamento')
  end

  it 'takes over and creates an idempotent agent reply' do
    payload = { company_id: company.id, content: 'Olá! Vou ajudar agora.', client_message_id: 'client-123' }

    expect do
      post "/api/v1/inbox/sessions/#{session.id}/messages", params: payload, headers: auth_headers_for(agent)
    end.to change { session.chat_messages.agent_messages.count }.by(1)

    expect(response).to have_http_status(:created)
    expect(session.reload).to have_attributes(mode: 'human_manual', inbox_status: 'in_progress', assigned_agent_id: agent.id)

    expect do
      post "/api/v1/inbox/sessions/#{session.id}/messages", params: payload, headers: auth_headers_for(agent)
    end.not_to change(ChatMessage, :count)
  end

  it 'returns the session to the bot' do
    patch "/api/v1/inbox/sessions/#{session.id}/mode",
          params: { company_id: company.id, mode: 'bot_only' },
          headers: auth_headers_for(agent)

    expect(response).to have_http_status(:ok)
    expect(session.reload).to have_attributes(mode: 'bot_only', inbox_status: 'active')
  end

  it 'denies members from another company' do
    outsider = create(:user, role: 'company', company: nil, approved_by_admin: true)
    create(:company_member, company: create(:company), user: outsider, status: 'active')

    get '/api/v1/inbox/sessions', params: { company_id: company.id }, headers: auth_headers_for(outsider)

    expect(response).to have_http_status(:forbidden)
  end
end
