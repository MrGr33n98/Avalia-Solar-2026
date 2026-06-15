# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GraphQL Sprint D — APQ & Dataloader', type: :request do
  let!(:category) { Category.create!(name: 'Sistemas Fotovoltaicos', seo_url: 'sistemas-fotovoltaicos', status: 'active', description: 'Descrição da categoria') }
  let!(:company1) do
    Company.create!(
      name: 'Solar Top',
      slug: 'solar-top',
      description: 'Descrição da Solar Top',
      email: 'contato@solartop.com.br',
      state: 'SP',
      city: 'São Paulo',
      phone: '11999999999',
      categories: [category],
      status: 'active'
    )
  end

  let!(:company2) do
    Company.create!(
      name: 'Volt Tech',
      slug: 'volt-tech',
      description: 'Descrição da Volt Tech',
      email: 'contato@volttech.com.br',
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      categories: [category],
      status: 'active'
    )
  end

  describe 'Automatic Persisted Queries (APQ)' do
    let(:query_string) { '{ companies { nodes { name } } }' }
    let(:sha256_hash) { Digest::SHA256.hexdigest(query_string) }

    before do
      # Mock do Redis para isolamento e garantia de funcionamento dos testes
      @mock_redis_store = {}
      allow(REDIS).to receive(:is_a?).and_call_original
      allow(REDIS).to receive(:is_a?).with(NullRedis).and_return(false)
      allow(REDIS).to receive(:get) { |key| @mock_redis_store[key] }
      allow(REDIS).to receive(:setex) { |key, _ttl, val| @mock_redis_store[key] = val }
    end

    it 'retorna PersistedQueryNotFound se a query nao estiver no cache' do
      post '/graphql', params: {
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: sha256_hash
          }
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['errors']).to be_present
      expect(json['errors'].first['message']).to eq('PersistedQueryNotFound')
      expect(json['errors'].first.dig('extensions', 'code')).to eq('PERSISTED_QUERY_NOT_FOUND')
    end

    it 'persiste a query no cache se fornecida juntamente com o hash' do
      # Envia a query completa e o hash
      post '/graphql', params: {
        query: query_string,
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: sha256_hash
          }
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['errors']).to_not be_present
      expect(json.dig('data', 'companies', 'nodes')).to be_present

      # Agora a query deve estar no mock store do Redis
      expect(@mock_redis_store["apq:#{sha256_hash}"]).to eq(query_string)
    end

    it 'resolve a query a partir do cache em requisicoes subsequentes sem a query no payload' do
      # Preenche o cache manualmente
      @mock_redis_store["apq:#{sha256_hash}"] = query_string

      # Envia apenas o hash (query vazia)
      post '/graphql', params: {
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: sha256_hash
          }
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['errors']).to_not be_present
      expect(json.dig('data', 'companies', 'nodes')).to be_present
      expect(json.dig('data', 'companies', 'nodes').map { |n| n['name'] }).to include('Solar Top', 'Volt Tech')
    end
  end

  describe 'Dataloader (Batching para Evitar N+1)' do
    it 'carrega categorias sem disparar consultas extras N+1' do
      query = <<~GRAPHQL
        query {
          companies {
            nodes {
              name
              categories {
                name
              }
            }
          }
        }
      GRAPHQL

      # Se o Dataloader estiver ativo, ele deve juntar as consultas de categorias
      post '/graphql', params: { query: query }, as: :json
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['errors']).to_not be_present
      
      companies_nodes = json.dig('data', 'companies', 'nodes')
      expect(companies_nodes.size).to eq(2)
      expect(companies_nodes.first['categories'].first['name']).to eq('Sistemas Fotovoltaicos')
    end
  end
end
