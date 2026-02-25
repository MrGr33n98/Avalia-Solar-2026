require 'rails_helper'

RSpec.describe 'Authentication Error Responses', type: :request do
  let(:password) { 'Password123!' }
  let(:user) { create(:user, password: password, password_confirmation: password, status: :active) }

  describe 'POST /api/v1/auth/login' do
    context 'with invalid credentials' do
      it 'returns a standardized 401 unauthorized response' do
        post '/api/v1/auth/login', params: {
          email: user.email,
          password: 'wrongpassword'
        }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json).to include(
          'code' => 'INVALID_CREDENTIALS',
          'message' => 'Credenciais inválidas.'
        )
      end
    end

    context 'with unconfirmed email' do
      let(:unconfirmed_user) { create(:user, password: password, password_confirmation: password, status: :active) }

      before do
        # Assume confirmed? check is implemented and returns false
        allow_any_instance_of(User).to receive(:confirmed?).and_return(false)
        # Ensure we are not in development to trigger the check
        allow(Rails.env).to receive(:development?).and_return(false)
      end

      it 'returns a standardized 403 forbidden response for unconfirmed users' do
        post '/api/v1/auth/login', params: {
          email: unconfirmed_user.email,
          password: password
        }

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json).to include(
          'code' => 'EMAIL_NOT_CONFIRMED',
          'message' => 'Por favor, confirme seu e-mail antes de fazer login.'
        )
      end
    end

    it 'returns a standardized 422 unprocessable entity response for missing credentials' do
      post '/api/v1/auth/login', params: { email: '', password: '' }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json).to include(
        'code' => 'MISSING_CREDENTIALS',
        'message' => 'Email e senha são obrigatórios.'
      )
    end

    it 'returns a standardized 403 forbidden response for blocked users' do
      user.confirm
      user.update!(status: :blocked)
      post '/api/v1/auth/login', params: { email: user.email, password: password }

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json).to include(
        'code' => 'USER_BLOCKED',
        'message' => 'Usuário não está ativo.'
      )
    end
  end

  describe 'Rate Limiting (Rack::Attack)' do
    before do
      Rack::Attack.enabled = true
      Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    end

    after do
      Rack::Attack.enabled = false
    end

    it 'returns a standardized 429 too many requests response' do
      # Set a specific IP to ensure consistency
      ip = '1.2.3.4'
      6.times do
        post '/api/v1/auth/login',
             params: { email: 'test@example.com', password: 'password' },
             headers: { 'REMOTE_ADDR' => ip }
      end

      expect(response).to have_http_status(:too_many_requests)
      json = JSON.parse(response.body)
      expect(json).to include(
        'code' => 'RATE_LIMIT_EXCEEDED',
        'message' => 'Muitas solicitações. Por favor, tente novamente mais tarde.'
      )
      expect(json).to have_key('details')
      expect(json['details']).to include('retry_after_seconds', 'limit', 'period')
    end
  end
end
