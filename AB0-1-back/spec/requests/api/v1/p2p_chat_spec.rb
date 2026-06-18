# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'P2P Chat API', type: :request do
  let(:feature_enabled) { true }
  let(:company) { create(:company, p2p_chat_enabled: true) }
  let(:buyer) { create(:user, role: 'review', company: nil, city: 'São Paulo', state: 'SP') }
  let(:company_user) { create(:user, role: 'company', company: nil, approved_by_admin: true) }

  before do
    create(:company_member, company: company, user: company_user, status: 'active')

    allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
      resolved = method.call
      resolved.merge(
        'p2p_chat' => {
          'state' => feature_enabled ? 'enabled' : 'locked',
          'reason' => feature_enabled ? nil : 'upgrade_required'
        }.compact
      )
    end
  end

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'POST /api/v1/conversations' do
    it 'creates or reuses a conversation for logged buyer users' do
      post '/api/v1/conversations',
           params: { company_id: company.id },
           headers: auth_headers_for(buyer)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      expect(payload['company_id']).to eq(company.id)
      expect(payload['user_id']).to eq(buyer.id)
      expect(payload['unread_count']).to eq(0)

      expect do
        post '/api/v1/conversations',
             params: { company_id: company.id },
             headers: auth_headers_for(buyer)
      end.not_to change(Conversation, :count)
    end

    it 'blocks company users from starting buyer conversations' do
      post '/api/v1/conversations',
           params: { company_id: company.id },
           headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:forbidden)
    end

    it 'blocks companies with disabled chat toggle' do
      company.update!(p2p_chat_enabled: false)

      post '/api/v1/conversations',
           params: { company_id: company.id },
           headers: auth_headers_for(buyer)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to eq('Chat is disabled for this company')
    end

    context 'when plan feature is locked' do
      let(:feature_enabled) { false }

      it 'blocks conversation creation' do
        post '/api/v1/conversations',
             params: { company_id: company.id },
             headers: auth_headers_for(buyer)

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['code']).to eq('P2P_CHAT_NOT_AVAILABLE')
      end
    end
  end

  describe 'GET /api/v1/conversations' do
    it 'returns conversations for active company members' do
      conversation = create(:conversation, company: company, user: buyer)
      create(:direct_message, conversation: conversation, sender_type: 'User', read_at: nil)

      get '/api/v1/conversations', headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      expect(payload.pluck('id')).to include(conversation.id)
      expect(payload.find { |item| item['id'] == conversation.id }['unread_count']).to eq(1)
    end
  end

  describe 'direct messages' do
    let(:conversation) { create(:conversation, company: company, user: buyer) }

    it 'marks messages from the other side as read when listing them' do
      message = create(:direct_message, conversation: conversation, sender_type: 'User', read_at: nil)

      get "/api/v1/conversations/#{conversation.id}/direct_messages",
          headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:ok)
      expect(message.reload.read_at).to be_present
    end

    it 'allows the company to reply from the dashboard' do
      post "/api/v1/conversations/#{conversation.id}/direct_messages",
           params: { body: 'Olá, podemos ajudar com seu projeto.' },
           headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:created)

      payload = JSON.parse(response.body)
      expect(payload['sender_type']).to eq('Company')
      expect(payload['body']).to eq('Olá, podemos ajudar com seu projeto.')
    end

    it 'prevents a member from another company from accessing the conversation' do
      other_company = create(:company, p2p_chat_enabled: true)
      other_user = create(:user, role: 'company', company: nil, approved_by_admin: true)
      create(:company_member, company: other_company, user: other_user, status: 'active')

      get "/api/v1/conversations/#{conversation.id}/direct_messages",
          headers: auth_headers_for(other_user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
