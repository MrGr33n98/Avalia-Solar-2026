# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Dashboard Services API', type: :request do
  let(:company) { create(:company, status: :active) }
  let(:user) { create(:user, company: company, status: :active, approved_by_admin: true, confirmed_at: Time.current) }
  let(:other_company) { create(:company, status: :active) }
  let(:category) { create(:category, name: 'Serviços Elétricos') }
  let(:token) { JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' } }

  before do
    create(:company_member, company: company, user: user, role: 'owner', status: 'active')
  end

  describe 'GET /api/v1/dashboard/services' do
    it 'returns only services owned by the authenticated company' do
      service = CompanyService.create!(
        company: company,
        category: category,
        name: 'Instalação Comercial',
        slug: 'instalacao-comercial',
        price_from: 3500.0,
        status: 'active'
      )

      CompanyService.create!(
        company: other_company,
        category: category,
        name: 'Serviço Concorrente',
        slug: 'servico-concorrente',
        price_from: 4000.0,
        status: 'active'
      )

      get '/api/v1/dashboard/services', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].map { |s| s['id'] }).to contain_exactly(service.id)
      expect(json.dig('meta', 'stats', 'total')).to eq(1)
      expect(json.dig('meta', 'stats', 'active')).to eq(1)
    end
  end

  describe 'POST /api/v1/dashboard/services' do
    it 'creates a service scoped to the authenticated company and generates slug' do
      post '/api/v1/dashboard/services', params: {
        service: {
          name: 'Homologação e Projeto',
          category_id: category.id,
          description: 'Elaboração e aprovação de projeto junto à concessionária.',
          price_from: 1200.0,
          status: 'active'
        }
      }, headers: headers

      expect(response).to have_http_status(:created)
      service = CompanyService.find_by!(name: 'Homologação e Projeto')
      expect(service.company).to eq(company)
      expect(service.slug).to eq('homologacao-e-projeto')
      expect(service.price_from).to eq(1200.0)
    end
  end

  describe 'PATCH /api/v1/dashboard/services/:id' do
    it 'updates own service' do
      service = CompanyService.create!(
        company: company,
        category: category,
        name: 'Manutenção Preventiva',
        slug: 'manutencao-preventiva',
        price_from: 800.0,
        status: 'active'
      )

      patch "/api/v1/dashboard/services/#{service.id}", params: {
        service: {
          price_from: 950.0,
          description: 'Limpeza e revisão completa de conexões'
        }
      }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(service.reload.price_from).to eq(950.0)
      expect(service.description).to eq('Limpeza e revisão completa de conexões')
    end

    it 'does not allow mutating services belonging to another company' do
      foreign_service = CompanyService.create!(
        company: other_company,
        category: category,
        name: 'Serviço Alheio',
        slug: 'servico-alheio',
        price_from: 1000.0,
        status: 'active'
      )

      patch "/api/v1/dashboard/services/#{foreign_service.id}", params: {
        service: { name: 'Adulterado' }
      }, headers: headers

      expect(response).to have_http_status(:not_found)
      expect(foreign_service.reload.name).to eq('Serviço Alheio')
    end
  end

  describe 'DELETE /api/v1/dashboard/services/:id' do
    it 'deletes own service' do
      service = CompanyService.create!(
        company: company,
        category: category,
        name: 'Serviço para Apagar',
        slug: 'servico-para-apagar',
        status: 'active'
      )

      delete "/api/v1/dashboard/services/#{service.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(CompanyService.find_by(id: service.id)).to be_nil
    end

    it 'does not allow deleting a service from another company' do
      foreign_service = CompanyService.create!(
        company: other_company,
        category: category,
        name: 'Serviço Protegido',
        slug: 'servico-protegido',
        status: 'active'
      )

      delete "/api/v1/dashboard/services/#{foreign_service.id}", headers: headers

      expect(response).to have_http_status(:not_found)
      expect(CompanyService.find_by(id: foreign_service.id)).to be_present
    end
  end
end
