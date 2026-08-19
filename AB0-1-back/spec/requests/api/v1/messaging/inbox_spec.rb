# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Messaging Platform Unified Inbox API', type: :request do
  let(:company) { create(:company, p2p_chat_enabled: true) }
  let(:buyer) { create(:user, role: 'review', company: nil) }
  let(:company_user) { create(:user, role: 'company', company: nil, approved_by_admin: true) }

  before do
    create(:company_member, company: company, user: company_user, status: 'active')
  end

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/messaging/inbox' do
    let!(:conversation) { create(:conversation, company: company, user: buyer) }
    let!(:message) { create(:direct_message, conversation: conversation, sender_type: 'User', body: 'Desejo fazer orçamento fotovoltaico.') }

    it 'returns formatted unified DTO items' do
      get '/api/v1/messaging/inbox', headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      expect(payload['items']).to be_an(Array)
      expect(payload['items'].first['id']).to eq("p2p:#{conversation.id}")
      expect(payload['items'].first['channel']).to eq('p2p')
      expect(payload['items'].first['last_message']['body']).to eq('Desejo fazer orçamento fotovoltaico.')
    end
  end

  describe 'GET /api/v1/messaging/unread_count' do
    let!(:conversation) { create(:conversation, company: company, user: buyer, company_unread_count: 3) }

    it 'returns aggregated total unread count' do
      get '/api/v1/messaging/unread_count', headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body)
      expect(payload['unread_count']).to eq(3)
    end
  end
end
