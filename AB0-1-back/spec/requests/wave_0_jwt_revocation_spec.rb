# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 0: JWT Authentication & Revocation Contract Specs', type: :request do
  def jwt_token_for(user, exp: 24.hours.from_now, iat: Time.current, typ: 'access')
    payload = {
      user_id: user.id,
      typ: typ,
      exp: exp.to_i,
      iat: iat.to_i,
      jti: SecureRandom.uuid
    }
    JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
  end

  let!(:user) do
    User.create!(
      name: 'Auth Target User',
      email: 'auth_target@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'company',
      confirmed_at: Time.current
    )
  end

  describe 'Environment Isolation Check' do
    it 'asserts test environment is active' do
      expect(Rails.env.test?).to be(true)
      expect(ActiveRecord::Base.connection.current_database).to match(/test|ab0_test/i)
    end
  end

  describe 'SEC-02 Fixed: JWT Revocation Verification' do
    it 'accepts valid unrevoked access token (200 OK)' do
      token = jwt_token_for(user)
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:ok)
    end

    it 'rejects revoked access token with 401 Unauthorized' do
      token = jwt_token_for(user)

      # Revoke token
      JwtBlacklistService.revoke_token(token)

      # Attempt request with revoked token
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects expired access token with 401 Unauthorized' do
      token = jwt_token_for(user, exp: 1.hour.ago)
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects malformed token with 401 Unauthorized' do
      get '/api/v1/auth/me', headers: { 'Authorization' => 'Bearer invalid.token.payload', 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects refresh token when presented on access token endpoint' do
      refresh_token = jwt_token_for(user, typ: 'refresh')
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{refresh_token}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects tokens when all user tokens have been revoked (logout-all)' do
      token_before = jwt_token_for(user, iat: 10.minutes.ago)

      # Trigger logout from all devices
      JwtBlacklistService.revoke_all_user_tokens(user.id)

      # Attempt request with pre-revocation token
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{token_before}", 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
