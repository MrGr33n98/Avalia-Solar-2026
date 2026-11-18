# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Brands', type: :request do
  let!(:brand_weg) { create(:brand, name: 'WEG Solar', slug: 'weg-solar', aliases: ['WEG'], status: 'active') }
  let!(:brand_fronius) { create(:brand, name: 'Fronius', slug: 'fronius', aliases: ['Fronius Brasil'], status: 'active') }
  let!(:brand_disabled) { create(:brand, name: 'Marca Desativada', slug: 'marca-desativada', status: 'disabled') }

  describe 'GET /api/v1/brands' do
    it 'retorna fabricantes ativos no contrato de catálogo com metadados' do
      get '/api/v1/brands', headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      expect(response.headers['Cache-Control']).to include('public', 'max-age=60')

      json = JSON.parse(response.body)
      expect(json).to have_key('data')
      expect(json).to have_key('meta')
      expect(json['data'].size).to eq(2)

      fronius = json['data'].find { |b| b['slug'] == 'fronius' }
      expect(fronius).to include(
        'name' => 'Fronius',
        'slug' => 'fronius',
        'logo_alt' => 'Fronius',
        'initials' => 'FR',
        'status' => 'active'
      )
      expect(fronius).to have_key('logo_url')
    end

    it 'filtra pelo termo de busca no nome' do
      get '/api/v1/brands', params: { q: 'WEG' }, headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].map { |b| b['slug'] }).to contain_exactly('weg-solar')
    end

    it 'filtra pelo termo de busca em aliases' do
      get '/api/v1/brands', params: { q: 'Brasil' }, headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].map { |b| b['slug'] }).to contain_exactly('fronius')
    end

    it 'respeita o limite de paginação e calcula next_cursor' do
      get '/api/v1/brands', params: { limit: 1 }, headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['meta']['limit']).to eq(1)
      expect(json['meta']['next_cursor']).not_to be_nil
    end

    it 'não expõe marcas inativas ou desativadas' do
      get '/api/v1/brands', headers: { 'ACCEPT' => 'application/json' }

      json = JSON.parse(response.body)
      slugs = json['data'].map { |b| b['slug'] }
      expect(slugs).not_to include('marca-desativada')
    end
  end

  describe 'GET /api/v1/brands/:id' do
    it 'retorna os detalhes do fabricante por slug' do
      get "/api/v1/brands/#{brand_fronius.slug}", headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']['name']).to eq('Fronius')
      expect(json['data']['slug']).to eq('fronius')
      expect(json['data']['initials']).to eq('FR')
    end

    it 'retorna os detalhes do fabricante por ID numérico' do
      get "/api/v1/brands/#{brand_fronius.id}", headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']['name']).to eq('Fronius')
    end

    it 'retorna 404 para identificador não existente' do
      get '/api/v1/brands/marca-fantasma', headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Fabricante não encontrado')
    end
  end
end
