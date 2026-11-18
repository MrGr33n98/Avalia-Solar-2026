# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Reviewer::PortfolioProjects', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_user) { create(:user, role: 'review') }
  let(:headers) do
    {
      'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id, typ: 'access', exp: 24.hours.from_now.to_i, iat: Time.current.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')}",
      'Content-Type' => 'application/json'
    }
  end

  describe 'GET /api/v1/reviewer/portfolio_projects' do
    it 'lists only projects belonging to current user' do
      own_project = create(:reviewer_portfolio_project, user: reviewer, title: 'Meu Projeto Solar')
      create(:reviewer_portfolio_project, user: other_user, title: 'Projeto de Outro')

      get '/api/v1/reviewer/portfolio_projects', headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(1)
      expect(body['data'].first['id']).to eq(own_project.id.to_s)
      expect(body['data'].first['title']).to eq('Meu Projeto Solar')
    end
  end

  describe 'GET /api/v1/reviewer/portfolio_projects/summary' do
    it 'returns truthful aggregated capacity and count metrics' do
      create(:reviewer_portfolio_project, user: reviewer, project_type: 'residential', capacity_kwp: 10.5)
      create(:reviewer_portfolio_project, user: reviewer, project_type: 'commercial', capacity_kwp: 20.0)

      get '/api/v1/reviewer/portfolio_projects/summary', headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']['total_projects']).to eq(2)
      expect(body['data']['total_capacity_kwp']).to eq(30.5)
      expect(body['data']['by_type']['residential']).to eq(1)
      expect(body['data']['by_type']['commercial']).to eq(1)
    end
  end

  describe 'POST /api/v1/reviewer/portfolio_projects' do
    it 'creates a new project and audit event' do
      brand = create(:brand, name: 'Deye')
      usage = create(:reviewer_brand_usage, user: reviewer, brand: brand)

      expect do
        post '/api/v1/reviewer/portfolio_projects',
             params: {
               project: {
                 title: 'Usina Solar Agro 100kWp',
                 project_type: 'rural',
                 city: 'Ribeirão Preto',
                 state: 'SP',
                 capacity_kwp: 100.0,
                 visibility: 'private'
               },
               brand_usage_ids: [usage.id]
             }.to_json,
             headers: headers
      end.to change(ReviewerPortfolioProject, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['data']['title']).to eq('Usina Solar Agro 100kWp')
      expect(body['data']['brands'].first['brand_name']).to eq('Deye')
      expect(ReviewerPortfolioProjectEvent.where(action: 'created').count).to eq(1)
    end

    it 'rejects linking brand_usages of another user' do
      brand = create(:brand, name: 'Deye')
      other_usage = create(:reviewer_brand_usage, user: other_user, brand: brand)

      post '/api/v1/reviewer/portfolio_projects',
           params: {
             project: {
               title: 'Tentativa de Fraude de Marca',
               project_type: 'residential',
               capacity_kwp: 10.0
             },
             brand_usage_ids: [other_usage.id]
           }.to_json,
           headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/reviewer/portfolio_projects/:id' do
    let(:project) { create(:reviewer_portfolio_project, user: reviewer, title: 'Projeto Original') }

    it 'updates project attributes and records audit' do
      patch "/api/v1/reviewer/portfolio_projects/#{project.id}",
            params: {
              project: {
                title: 'Projeto Atualizado',
                lock_version: project.lock_version
              }
            }.to_json,
            headers: headers

      expect(response).to have_http_status(:ok)
      expect(project.reload.title).to eq('Projeto Atualizado')
      expect(ReviewerPortfolioProjectEvent.where(action: 'updated').count).to eq(1)
    end

    it 'handles optimistic locking conflict gracefully' do
      patch "/api/v1/reviewer/portfolio_projects/#{project.id}",
            params: {
              project: {
                title: 'Tentativa Concorrente',
                lock_version: 999
              }
            }.to_json,
            headers: headers

      expect(response).to have_http_status(:conflict)
    end
  end

  describe 'DELETE /api/v1/reviewer/portfolio_projects/:id' do
    let(:project) { create(:reviewer_portfolio_project, user: reviewer) }

    it 'soft-deletes project and marks status disabled' do
      delete "/api/v1/reviewer/portfolio_projects/#{project.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(project.reload.status).to eq('disabled')
      expect(ReviewerPortfolioProjectEvent.where(action: 'disabled').count).to eq(1)
    end

    it 'returns 404 for project of another user' do
      other_project = create(:reviewer_portfolio_project, user: other_user)
      delete "/api/v1/reviewer/portfolio_projects/#{other_project.id}", headers: headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
