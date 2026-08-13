# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Api::V1::Chat::SessionsController", type: :request do
  describe "POST /api/v1/chat/sessions" do
    let(:valid_params) do
      {
        vertical: 'solar',
        page_url: 'https://www.avaliasolar.com.br/',
        referrer: ''
      }
    end

    it "cria sessão anônima e retorna 201" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      expect(response).to have_http_status(:created)
    end

    it "não retorna 500" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      expect(response.status).not_to eq(500)
    end

    it "persiste a sessão no banco" do
      expect {
        post "/api/v1/chat/sessions", params: valid_params, as: :json
      }.to change(ChatSession, :count).by(1)
    end

    it "gera visitor_nonce único na sessão" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      session = ChatSession.last
      expect(session.visitor_nonce).to be_present
      expect(session.visitor_nonce.length).to be >= 32
    end

    it "retorna access_token no payload" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      body = response.parsed_body
      expect(body.dig('session', 'access_token')).to be_present
    end

    it "retorna id de sessão no payload" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      body = response.parsed_body
      expect(body.dig('session', 'id')).to be_present
    end

    it "retorna mensagem inicial de boas-vindas" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      body = response.parsed_body
      expect(body['messages']).to be_an(Array)
      expect(body['messages'].first['role']).to eq('assistant')
    end

    it "access_token é verificável via Chat::SessionAccessToken" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      token = response.parsed_body.dig('session', 'access_token')
      session = ChatSession.last
      expect {
        Chat::SessionAccessToken.verify(token, session: session)
      }.not_to raise_error
    end

    it "dois tokens de sessões distintas não são intercambiáveis" do
      post "/api/v1/chat/sessions", params: valid_params, as: :json
      token1 = response.parsed_body.dig('session', 'access_token')

      post "/api/v1/chat/sessions", params: valid_params, as: :json
      session2 = ChatSession.last

      expect {
        Chat::SessionAccessToken.verify(token1, session: session2)
      }.to raise_error(Chat::SessionAccessToken::InvalidToken)
    end

    context "com vertical electric_mobility" do
      it "retorna mensagem de MobiVolt elétrico" do
        post "/api/v1/chat/sessions", params: valid_params.merge(vertical: 'electric_mobility'), as: :json
        body = response.parsed_body
        expect(body['messages'].first['content']).to include('MobiVolt')
      end
    end

    context "com chat desabilitado" do
      before { allow(ENV).to receive(:fetch).and_call_original }
      before { allow(ENV).to receive(:fetch).with('CHAT_ENABLED', 'true').and_return('false') }

      it "retorna 503" do
        post "/api/v1/chat/sessions", params: valid_params, as: :json
        expect(response).to have_http_status(:service_unavailable)
      end
    end
  end
end
