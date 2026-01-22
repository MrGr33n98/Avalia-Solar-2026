# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JwtBlacklistService, type: :service do
  let(:user) { User.create!(email: 'test@example.com', password: 'password123', name: 'Test User') }
  let(:payload) { { user_id: user.id, exp: 1.hour.from_now.to_i, iat: Time.current.to_i, jti: SecureRandom.uuid } }
  let(:token) { JWT.encode(payload, Rails.application.secret_key_base) }
  let(:jti) { payload[:jti] }
  
  before do
    skip 'Redis not available' unless defined?(REDIS) && !REDIS.is_a?(NullRedis)
    # Clean up Redis before each test
    REDIS.keys('jwt:*').each { |k| REDIS.del(k) }
  end
  
  after do
    # Clean up after tests
    REDIS.keys('jwt:*').each { |k| REDIS.del(k) } if defined?(REDIS) && !REDIS.is_a?(NullRedis)
  end
  
  describe '.revoke_token' do
    it 'adds token to blacklist' do
      result = described_class.revoke_token(token)
      
      expect(result).to be true
      expect(described_class.revoked?(token)).to be true
    end
    
    it 'sets TTL based on token expiration' do
      described_class.revoke_token(token)
      
      ttl = REDIS.ttl("#{described_class::REDIS_PREFIX}#{jti}")
      expect(ttl).to be > 0
      expect(ttl).to be <= 1.hour.to_i
    end
    
    it 'handles tokens without JTI' do
      token_no_jti = JWT.encode({ user_id: user.id, exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base)
      
      result = described_class.revoke_token(token_no_jti)
      expect(result).to be true
      expect(described_class.revoked?(token_no_jti)).to be true
    end
    
    it 'does not revoke expired tokens (TTL <= 0)' do
      expired_payload = payload.merge(exp: 1.hour.ago.to_i)
      expired_token = JWT.encode(expired_payload, Rails.application.secret_key_base)
      
      result = described_class.revoke_token(expired_token)
      expect(result).to be false
    end
    
    it 'accepts custom expiration time' do
      custom_exp = 30.minutes.from_now
      result = described_class.revoke_token(token, exp: custom_exp)
      
      expect(result).to be true
      
      ttl = REDIS.ttl("#{described_class::REDIS_PREFIX}#{jti}")
      expect(ttl).to be > 0
      expect(ttl).to be <= 30.minutes.to_i
    end
    
    it 'logs revocation' do
      expect(Rails.logger).to receive(:info).with(/Token revoked/)
      described_class.revoke_token(token)
    end
  end
  
  describe '.revoked?' do
    it 'returns false for valid token' do
      expect(described_class.revoked?(token)).to be false
    end
    
    it 'returns true for revoked token' do
      described_class.revoke_token(token)
      expect(described_class.revoked?(token)).to be true
    end
    
    it 'returns false for invalid token' do
      invalid_token = 'invalid.token.here'
      expect(described_class.revoked?(invalid_token)).to be false
    end
  end
  
  describe '.revoke_all_user_tokens' do
    it 'marks all user tokens as revoked' do
      result = described_class.revoke_all_user_tokens(user.id)
      
      expect(result).to be true
      
      revoked_at = described_class.user_tokens_revoked_at(user.id)
      expect(revoked_at).to be_present
      expect(revoked_at).to be_within(2.seconds).of(Time.current)
    end
    
    it 'sets 24-hour TTL' do
      described_class.revoke_all_user_tokens(user.id)
      
      ttl = REDIS.ttl("#{described_class::USER_PREFIX}#{user.id}")
      expect(ttl).to be > 0
      expect(ttl).to be <= 24.hours.to_i
    end
    
    it 'logs revocation' do
      expect(Rails.logger).to receive(:info).with(/All tokens revoked/)
      described_class.revoke_all_user_tokens(user.id)
    end
  end
  
  describe '.user_tokens_revoked_at' do
    it 'returns nil when no revocation exists' do
      result = described_class.user_tokens_revoked_at(user.id)
      expect(result).to be_nil
    end
    
    it 'returns timestamp after revocation' do
      freeze_time = Time.current
      
      Timecop.freeze(freeze_time) do
        described_class.revoke_all_user_tokens(user.id)
      end
      
      result = described_class.user_tokens_revoked_at(user.id)
      expect(result).to be_within(1.second).of(freeze_time)
    end
  end
  
  describe '.stats' do
    it 'returns statistics about blacklisted tokens' do
      # Add some tokens
      described_class.revoke_token(token)
      described_class.revoke_all_user_tokens(user.id)
      
      stats = described_class.stats
      
      expect(stats[:available]).to be true
      expect(stats[:blacklisted_tokens]).to eq(1)
      expect(stats[:users_with_revoked_tokens]).to eq(1)
      expect(stats[:total_keys]).to eq(2)
    end
    
    it 'returns unavailable when Redis is down' do
      allow(described_class).to receive(:redis_available?).and_return(false)
      
      stats = described_class.stats
      expect(stats[:available]).to be false
    end
  end
  
  describe 'integration scenarios' do
    it 'handles multiple tokens for same user' do
      token1 = JWT.encode(payload.merge(jti: SecureRandom.uuid), Rails.application.secret_key_base)
      token2 = JWT.encode(payload.merge(jti: SecureRandom.uuid), Rails.application.secret_key_base)
      
      described_class.revoke_token(token1)
      
      expect(described_class.revoked?(token1)).to be true
      expect(described_class.revoked?(token2)).to be false
    end
    
    it 'handles user-wide revocation' do
      old_token = JWT.encode(payload.merge(iat: 1.hour.ago.to_i), Rails.application.secret_key_base)
      
      freeze_time = Time.current
      Timecop.freeze(freeze_time) do
        described_class.revoke_all_user_tokens(user.id)
      end
      
      new_token = JWT.encode(payload.merge(iat: Time.current.to_i), Rails.application.secret_key_base)
      
      revoked_at = described_class.user_tokens_revoked_at(user.id)
      
      old_payload = JWT.decode(old_token, nil, false).first
      expect(old_payload['iat']).to be < revoked_at.to_i
      
      new_payload = JWT.decode(new_token, nil, false).first
      expect(new_payload['iat']).to be >= revoked_at.to_i
    end
  end
end
