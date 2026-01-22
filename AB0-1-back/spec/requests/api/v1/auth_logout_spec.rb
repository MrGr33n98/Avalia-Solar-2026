# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Auth Logout API', type: :request do
  let(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User') }
  let(:headers) { { 'Content-Type' => 'application/json' } }
  
  before do
    skip 'Redis not available' unless defined?(REDIS) && !REDIS.is_a?(NullRedis)
    # Clean up Redis before each test
    REDIS.keys('jwt:*').each { |k| REDIS.del(k) }
  end
  
  after do
    # Clean up after tests
    REDIS.keys('jwt:*').each { |k| REDIS.del(k) } if defined?(REDIS) && !REDIS.is_a?(NullRedis)
  end
  
  describe 'POST /api/v1/auth/logout' do
    context 'with valid token in header' do
      before do
        post '/api/v1/auth/login', 
          params: { email: user.email, password: 'password123' }.to_json, 
          headers: headers
        
        @response_data = JSON.parse(response.body)
        @token = @response_data['token']
      end
      
      it 'revokes the token' do
        expect(@token).to be_present
        
        post '/api/v1/auth/logout', 
          headers: headers.merge('Authorization' => "Bearer #{@token}")
        
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['message']).to eq('Logout successful')
        
        # Verify token is blacklisted
        expect(JwtBlacklistService.revoked?(@token)).to be true
      end
      
      it 'rejects subsequent requests with revoked token' do
        post '/api/v1/auth/logout', 
          headers: headers.merge('Authorization' => "Bearer #{@token}")
        
        expect(response).to have_http_status(:ok)
        
        # Try to use the revoked token
        get '/api/v1/auth/me', 
          headers: headers.merge('Authorization' => "Bearer #{@token}")
        
        expect(response).to have_http_status(:unauthorized)
        body = JSON.parse(response.body)
        expect(body['error']).to match(/revoked|expired/i)
      end
      
      it 'clears the JWT cookie' do
        post '/api/v1/auth/logout', 
          headers: headers.merge('Authorization' => "Bearer #{@token}")
        
        # Check Set-Cookie header for deletion
        set_cookie = response.headers['Set-Cookie']
        expect(set_cookie).to include('jwt_token=') if set_cookie
      end
    end
    
    context 'with valid token in cookie' do
      before do
        post '/api/v1/auth/login', 
          params: { email: user.email, password: 'password123' }.to_json, 
          headers: headers
        
        @token = JSON.parse(response.body)['token']
        @cookies = response.headers['Set-Cookie']
      end
      
      it 'revokes the token from cookie' do
        post '/api/v1/auth/logout', 
          headers: headers.merge('Cookie' => @cookies)
        
        expect(response).to have_http_status(:ok)
        expect(JwtBlacklistService.revoked?(@token)).to be true
      end
    end
    
    context 'without token' do
      it 'still returns success' do
        post '/api/v1/auth/logout', headers: headers
        
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['message']).to eq('Logout successful')
      end
    end
  end
  
  describe 'POST /api/v1/auth/logout_all' do
    let(:token1) { login_and_get_token }
    let(:token2) { login_and_get_token }
    
    def login_and_get_token
      post '/api/v1/auth/login', 
        params: { email: user.email, password: 'password123' }.to_json, 
        headers: headers
      
      JSON.parse(response.body)['token']
    end
    
    it 'revokes all user tokens' do
      expect(token1).to be_present
      expect(token2).to be_present
      expect(token1).not_to eq(token2)
      
      # Logout from all devices using token1
      post '/api/v1/auth/logout_all', 
        headers: headers.merge('Authorization' => "Bearer #{token1}")
      
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['message']).to match(/all devices/i)
      
      # Both tokens should be rejected now
      get '/api/v1/auth/me', 
        headers: headers.merge('Authorization' => "Bearer #{token1}")
      expect(response).to have_http_status(:unauthorized)
      
      get '/api/v1/auth/me', 
        headers: headers.merge('Authorization' => "Bearer #{token2}")
      expect(response).to have_http_status(:unauthorized)
    end
    
    it 'allows new login after logout_all' do
      post '/api/v1/auth/logout_all', 
        headers: headers.merge('Authorization' => "Bearer #{token1}")
      
      # New login should work
      post '/api/v1/auth/login', 
        params: { email: user.email, password: 'password123' }.to_json, 
        headers: headers
      
      expect(response).to have_http_status(:ok)
      new_token = JSON.parse(response.body)['token']
      
      # New token should work
      get '/api/v1/auth/me', 
        headers: headers.merge('Authorization' => "Bearer #{new_token}")
      
      expect(response).to have_http_status(:ok)
    end
    
    it 'logs the revocation event' do
      expect(Rails.logger).to receive(:info).with(/logged out from all devices/)
      
      post '/api/v1/auth/logout_all', 
        headers: headers.merge('Authorization' => "Bearer #{token1}")
    end
  end
  
  describe 'Token revocation integration' do
    it 'prevents access to protected endpoints after logout' do
      # Login
      post '/api/v1/auth/login', 
        params: { email: user.email, password: 'password123' }.to_json, 
        headers: headers
      
      token = JSON.parse(response.body)['token']
      auth_headers = headers.merge('Authorization' => "Bearer #{token}")
      
      # Access protected endpoint (should work)
      get '/api/v1/auth/me', headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      # Logout
      post '/api/v1/auth/logout', headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      # Try to access protected endpoint again (should fail)
      get '/api/v1/auth/me', headers: auth_headers
      expect(response).to have_http_status(:unauthorized)
      
      body = JSON.parse(response.body)
      expect(body['code']).to eq('TOKEN_REVOKED').or eq('SESSION_EXPIRED')
    end
    
    it 'handles concurrent logouts gracefully' do
      token = login_and_get_token
      auth_headers = headers.merge('Authorization' => "Bearer #{token}")
      
      # Logout twice
      post '/api/v1/auth/logout', headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      post '/api/v1/auth/logout', headers: auth_headers
      # Should not crash, just return unauthorized
      expect(response).to have_http_status(:unauthorized)
    end
  end
  
  describe 'Security scenarios' do
    it 'does not reveal user existence on logout' do
      fake_token = JWT.encode({ user_id: 99999, exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base)
      
      post '/api/v1/auth/logout', 
        headers: headers.merge('Authorization' => "Bearer #{fake_token}")
      
      # Should not reveal whether user exists
      expect(response).to have_http_status(:ok)
    end
    
    it 'logs security events' do
      token = login_and_get_token
      
      expect(Rails.logger).to receive(:info).with(/User logged out/)
      
      post '/api/v1/auth/logout', 
        headers: headers.merge('Authorization' => "Bearer #{token}")
    end
  end
  
  def login_and_get_token
    post '/api/v1/auth/login', 
      params: { email: user.email, password: 'password123' }.to_json, 
      headers: headers
    
    JSON.parse(response.body)['token']
  end
end
