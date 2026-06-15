# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GraphQL Security & Throttling' do
  include Rack::Test::Methods

  def app
    Rails.application
  end

  before do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    Rack::Attack.cache.store.clear
  end

  after do
    Rack::Attack.enabled = false
  end

  describe 'Query Depth Limit' do
    it 'allows query within depth limit (<= 7)' do
      # Query com profundidade 3
      query = <<~GRAPHQL
        query {
          categories {
            name
            children {
              name
            }
          }
        }
      GRAPHQL

      post '/graphql', { query: query }.to_json, { 'CONTENT_TYPE' => 'application/json' }
      
      expect(last_response.status).to eq(200)
      json = JSON.parse(last_response.body)
      expect(json['errors']).to be_nil
    end

    it 'blocks query exceeding depth limit (> 7)' do
      # Query com profundidade 9
      query = <<~GRAPHQL
        query {
          categories {
            children {
              children {
                children {
                  children {
                    children {
                      children {
                        children {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      GRAPHQL

      post '/graphql', { query: query }.to_json, { 'CONTENT_TYPE' => 'application/json' }
      
      expect(last_response.status).to eq(200) # O Rails/GraphQL responde 200, mas com a lista de erros no JSON
      json = JSON.parse(last_response.body)
      expect(json['errors']).not_to be_nil
      expect(json['errors'].first['message']).to include('exceeds max depth')
    end
  end

  describe 'Rack::Attack GraphQL Mutation Throttling' do
    let(:create_lead_mutation) { <<~GRAPHQL }
      mutation CreateLead($input: CreateLeadInput!) {
        createLead(input: $input) {
          lead {
            id
            status
          }
        }
      }
    GRAPHQL

    let(:query_payload) { { query: create_lead_mutation, variables: { input: {} } }.to_json }

    it 'allows mutation requests under limit (10/min)' do
      9.times do
        post '/graphql', query_payload, { 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '203.0.113.19' }
        expect(last_response.status).not_to eq(429)
      end
    end

    it 'blocks mutation requests over limit (10/min)' do
      11.times do
        post '/graphql', query_payload, { 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '203.0.113.19' }
      end

      expect(last_response.status).to eq(429)
      json = JSON.parse(last_response.body)
      expect(json['code']).to eq('RATE_LIMIT_EXCEEDED')
    end

    it 'does not throttle general non-mutation queries under the same strict limit' do
      # Queries gerais de consulta têm limite maior (60/min)
      general_query = { query: 'query { categories { name } }' }.to_json
      
      15.times do
        post '/graphql', general_query, { 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '203.0.113.19' }
        expect(last_response.status).not_to eq(429)
      end
    end
  end
end
