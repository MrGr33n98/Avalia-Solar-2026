# frozen_string_literal: true

require 'rails_helper'
require 'jwt'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe 'GraphQL Sprint A — User, Leads & Reviews', type: :request do
  let!(:user) do
    User.create!(
      name: 'João da Silva',
      email: 'joao.silva@example.com',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      role: 'review',
      city: 'São Paulo',
      state: 'SP',
      terms_accepted: true,
      status: :active
    )
  end

  let!(:other_user) do
    User.create!(
      name: 'Maria Sousa',
      email: 'maria.sousa@example.com',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      role: 'review',
      city: 'Florianópolis',
      state: 'SC',
      terms_accepted: true,
      status: :active
    )
  end

  let!(:category) do
    Category.create!(
      name: 'Energia Solar',
      description: 'Categoria de testes para RSpec',
      status: 'active'
    )
  end

  let!(:company) do
    comp = Company.new(
      name: 'Solar Tech',
      description: 'Uma excelente empresa solar',
      email: 'contato@solartech.com',
      phone: '(11) 99999-9999',
      city: 'São Paulo',
      state: 'SP',
      status: 'active',
      active_admin: true
    )
    comp.categories << category
    comp.save!
    comp
  end

  let!(:user_lead) do
    Lead.create!(
      name: user.name,
      email: user.email,
      phone: '11988887777',
      message: 'Quero um orçamento residencial',
      city: 'São Paulo',
      state: 'SP',
      company_id: company.id,
      category_id: category.id,
      wizard_status: 'verified',
      product_vertical: 'residencial',
      project_type: 'residencial',
      project_profile: 'standard',
      quote_type: 'commercial',
      system_size_band: 'small',
      decision_timeline: 'immediate',
      address_full: 'Rua das Flores, 123, São Paulo - SP',
      consent_at: Time.current
    )
  end

  let!(:other_lead) do
    Lead.create!(
      name: other_user.name,
      email: other_user.email,
      phone: '48988887777',
      message: 'Quero um orçamento B2B',
      city: 'Florianópolis',
      state: 'SC',
      company_id: company.id,
      category_id: category.id,
      wizard_status: 'distributed',
      product_vertical: 'comercial',
      project_type: 'comercial',
      project_profile: 'standard',
      quote_type: 'commercial',
      system_size_band: 'small',
      decision_timeline: 'immediate',
      address_full: 'Rua das Palmeiras, 321, Florianópolis - SC',
      consent_at: Time.current
    )
  end

  let!(:user_review) do
    Review.create!(
      rating: 5.0,
      comment: 'Serviço muito bom e entrega rápida.',
      headline: 'Recomendo muito!',
      user_id: user.id,
      company_id: company.id,
      category_id: category.id,
      status: :approved,
      capture_flow_source: 'profile'
    )
  end

  let!(:other_review) do
    Review.create!(
      rating: 4.0,
      comment: 'Boa empresa no geral.',
      headline: 'Satisfeito',
      user_id: other_user.id,
      company_id: company.id,
      category_id: category.id,
      status: :approved,
      capture_flow_source: 'profile'
    )
  end

  def generate_jwt_token(target_user)
    payload = { user_id: target_user.id }
    JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(target_user)
    token = generate_jwt_token(target_user)
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'Query me' do
    let(:query) do
      <<-GRAPHQL
        query {
          me {
            id
            name
            email
            city
            state
            role
          }
        }
      GRAPHQL
    end

    it 'retorna nulo se o usuário não estiver autenticado' do
      post '/graphql', params: { query: query }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'me')).to be_nil
    end

    it 'retorna os dados do usuário logado se autenticado' do
      post '/graphql', params: { query: query }, headers: auth_headers(user)
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      data = json.dig('data', 'me')
      expect(data).to be_present
      expect(data['id']).to eq(user.id.to_s)
      expect(data['name']).to eq(user.name)
      expect(data['email']).to eq(user.email)
      expect(data['city']).to eq(user.city)
      expect(data['state']).to eq(user.state)
    end
  end

  describe 'Query myLeads' do
    let(:query) do
      <<-GRAPHQL
        query MyLeads($status: String, $page: Int, $perPage: Int) {
          myLeads(status: $status, page: $page, perPage: $perPage) {
            nodes {
              id
              status
              serviceType
              message
              city
              state
              origin
              company {
                id
                name
              }
            }
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
          }
        }
      GRAPHQL
    end

    it 'retorna erro de autenticação se não autenticado' do
      post '/graphql', params: { query: query }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['errors']).to be_present
      expect(json.dig('errors', 0, 'message')).to include('Autenticação necessária')
    end

    it 'retorna apenas os leads do usuário logado' do
      post '/graphql', params: { query: query }, headers: auth_headers(user)
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      leads = json.dig('data', 'myLeads', 'nodes')
      page_info = json.dig('data', 'myLeads', 'pageInfo')

      expect(leads.size).to eq(1)
      expect(leads[0]['id']).to eq(user_lead.id.to_s)
      expect(leads[0]['message']).to eq(user_lead.message)
      expect(leads[0]['company']['id']).to eq(company.id.to_s)
      expect(page_info['totalCount']).to eq(1)
    end

    it 'permite filtrar os leads por status' do
      # Busca com status que não existe para o usuário
      post '/graphql', params: { query: query, variables: { status: 'distributed' } }, headers: auth_headers(user)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'myLeads', 'nodes')).to be_empty

      # Busca com status correto
      post '/graphql', params: { query: query, variables: { status: 'verified' } }, headers: auth_headers(user)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'myLeads', 'nodes').size).to eq(1)
    end
  end

  describe 'Query myReviews' do
    let(:query) do
      <<-GRAPHQL
        query MyReviews($status: String, $page: Int, $perPage: Int) {
          myReviews(status: $status, page: $page, perPage: $perPage) {
            nodes {
              id
              rating
              comment
              status
              company {
                id
                name
              }
            }
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
          }
        }
      GRAPHQL
    end

    it 'retorna erro de autenticação se não autenticado' do
      post '/graphql', params: { query: query }
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['errors']).to be_present
      expect(json.dig('errors', 0, 'message')).to include('Autenticação necessária')
    end

    it 'retorna apenas as avaliações do usuário logado' do
      post '/graphql', params: { query: query }, headers: auth_headers(user)
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      reviews = json.dig('data', 'myReviews', 'nodes')
      page_info = json.dig('data', 'myReviews', 'pageInfo')

      expect(reviews.size).to eq(1)
      expect(reviews[0]['id']).to eq(user_review.id.to_s)
      expect(reviews[0]['comment']).to eq(user_review.comment)
      expect(reviews[0]['company']['id']).to eq(company.id.to_s)
      expect(page_info['totalCount']).to eq(1)
    end

    it 'permite filtrar as avaliações por status' do
      # Filtra por aprovadas
      post '/graphql', params: { query: query, variables: { status: 'approved' } }, headers: auth_headers(user)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'myReviews', 'nodes').size).to eq(1)

      # Filtra por pendentes (que não temos)
      post '/graphql', params: { query: query, variables: { status: 'pending' } }, headers: auth_headers(user)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'myReviews', 'nodes')).to be_empty
    end
  end
end
