# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rack::Attack' do
  include Rack::Test::Methods

  def app
    Rails.application
  end

  let(:valid_token) { 'Bearer test_token' }

  before do
    Rack::Attack.cache.store.clear
  end

  describe 'analytics tracking throttle' do
    let(:endpoint) { '/api/v1/analytics/track' }

    it 'allows requests under limit (100/min)' do
      99.times do
        post endpoint, { event_type: 'profile_view' }.to_json, { 'CONTENT_TYPE' => 'application/json' }
      end

      post endpoint, { event_type: 'profile_view' }.to_json, { 'CONTENT_TYPE' => 'application/json' }
      expect(last_response.status).not_to eq(429)
    end

    it 'blocks requests over limit' do
      101.times do
        post endpoint, { event_type: 'profile_view' }.to_json, { 'CONTENT_TYPE' => 'application/json' }
      end

      expect(last_response.status).to eq(429)
      json = JSON.parse(last_response.body)
      expect(json['error']).to eq('Rate limit exceeded')
    end

    it 'includes rate limit headers' do
      post endpoint, { event_type: 'profile_view' }.to_json, { 'CONTENT_TYPE' => 'application/json' }

      expect(last_response.headers).to include('X-RateLimit-Limit')
    end
  end

  describe 'authenticated API throttle' do
    let(:endpoint) { '/api/v1/companies' }

    it 'allows requests under limit (300/5min)' do
      299.times do
        get endpoint, {}, { 'HTTP_AUTHORIZATION' => valid_token }
      end

      get endpoint, {}, { 'HTTP_AUTHORIZATION' => valid_token }
      expect(last_response.status).not_to eq(429)
    end

    it 'blocks requests over limit' do
      301.times do
        get endpoint, {}, { 'HTTP_AUTHORIZATION' => valid_token }
      end

      expect(last_response.status).to eq(429)
    end

    it 'throttles by token' do
      150.times { get endpoint, {}, { 'HTTP_AUTHORIZATION' => 'Bearer token1' } }
      150.times { get endpoint, {}, { 'HTTP_AUTHORIZATION' => 'Bearer token2' } }

      # Both tokens should still work (separate limits)
      get endpoint, {}, { 'HTTP_AUTHORIZATION' => 'Bearer token1' }
      expect(last_response.status).not_to eq(429)
    end
  end

  describe 'login throttle' do
    let(:endpoint) { '/api/v1/auth/login' }

    it 'allows 5 login attempts per minute' do
      4.times do
        post endpoint, { email: 'test@example.com', password: 'wrong' }.to_json, 
             { 'CONTENT_TYPE' => 'application/json' }
      end

      post endpoint, { email: 'test@example.com', password: 'wrong' }.to_json,
           { 'CONTENT_TYPE' => 'application/json' }
      expect(last_response.status).not_to eq(429)
    end

    it 'blocks excessive login attempts' do
      6.times do
        post endpoint, { email: 'test@example.com', password: 'wrong' }.to_json,
             { 'CONTENT_TYPE' => 'application/json' }
      end

      expect(last_response.status).to eq(429)
    end
  end

  describe 'registration throttle' do
    let(:endpoint) { '/api/v1/auth/register' }

    it 'allows 3 registrations per hour' do
      2.times do |i|
        post endpoint, { email: "test#{i}@example.com", password: 'test123' }.to_json,
             { 'CONTENT_TYPE' => 'application/json' }
      end

      post endpoint, { email: 'test3@example.com', password: 'test123' }.to_json,
           { 'CONTENT_TYPE' => 'application/json' }
      expect(last_response.status).not_to eq(429)
    end

    it 'blocks excessive registration attempts' do
      4.times do |i|
        post endpoint, { email: "test#{i}@example.com", password: 'test123' }.to_json,
             { 'CONTENT_TYPE' => 'application/json' }
      end

      expect(last_response.status).to eq(429)
    end
  end
end
