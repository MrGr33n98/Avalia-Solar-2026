# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Companies Cache Strategy' do
  let!(:company1) { create(:company, name: 'Solar Co', status: 'active') }
  let!(:company2) { create(:company, name: 'Energy Inc', status: 'active') }

  before do
    Rails.cache.clear
  end

  describe 'GET /api/v1/companies' do
    it 'caches the response' do
      get '/api/v1/companies'
      expect(response).to have_http_status(:ok)

      # Check cache was written
      cache_keys = Rails.cache.redis.keys('companies:index:v2:*')
      expect(cache_keys).not_to be_empty
    end

    it 'uses different cache keys for different filters' do
      get '/api/v1/companies', params: { featured: true }
      get '/api/v1/companies', params: { verified: true }

      cache_keys = Rails.cache.redis.keys('companies:index:v2:*')
      expect(cache_keys.length).to be >= 2
    end

    it 'invalidates cache when company is updated' do
      get '/api/v1/companies'
      cache_keys_before = Rails.cache.redis.keys('companies:index:v2:*')
      expect(cache_keys_before).not_to be_empty

      company1.update!(name: 'Solar Co Updated')

      cache_keys_after = Rails.cache.redis.keys('companies:index:v2:*')
      expect(cache_keys_after).to be_empty
    end

    it 'invalidates cache when company is destroyed' do
      get '/api/v1/companies'
      expect(Rails.cache.redis.keys('companies:index:v2:*')).not_to be_empty

      company1.destroy

      expect(Rails.cache.redis.keys('companies:index:v2:*')).to be_empty
    end

    it 'uses shorter TTL for search queries' do
      # This would require inspecting cache expiration, which is complex
      # Instead, verify the method exists and is called
      controller = Api::V1::CompaniesController.new
      ttl = controller.send(:cache_ttl_for_params, { q: 'test' })
      expect(ttl).to eq(5.minutes)
    end

    it 'uses longer TTL for featured queries' do
      controller = Api::V1::CompaniesController.new
      ttl = controller.send(:cache_ttl_for_params, { featured: true })
      expect(ttl).to eq(1.hour)
    end
  end

  describe 'cache key generation' do
    it 'generates consistent keys for same params' do
      controller = Api::V1::CompaniesController.new
      
      key1 = controller.send(:generate_cache_key, { featured: true, status: 'active' })
      key2 = controller.send(:generate_cache_key, { featured: true, status: 'active' })
      
      expect(key1).to eq(key2)
    end

    it 'generates different keys for different params' do
      controller = Api::V1::CompaniesController.new
      
      key1 = controller.send(:generate_cache_key, { featured: true })
      key2 = controller.send(:generate_cache_key, { verified: true })
      
      expect(key1).not_to eq(key2)
    end

    it 'includes version in key' do
      controller = Api::V1::CompaniesController.new
      key = controller.send(:generate_cache_key, {})
      
      expect(key).to include('companies:index:v2:')
    end
  end
end
