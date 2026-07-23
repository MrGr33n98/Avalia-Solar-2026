# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public company content', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }

  before do
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('projects_showcase').and_return(true)
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(true)
  end

  describe 'GET /api/v1/companies/:company_id/projects' do
    it 'returns only the published projects of the requested company with published assets' do
      published = create(:company_project, company: company, status: 'published', published_at: 1.minute.ago, title: 'Usina pública')
      create(:digital_asset, attachable: published, company: company, status: 'published', processing_status: 'ready')
      create(:company_project, company: company, status: 'draft', title: 'Rascunho privado')
      create(:company_project, company: other_company, status: 'published', published_at: 1.minute.ago, title: 'Projeto de outra empresa')

      get "/api/v1/companies/#{company.id}/projects"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['projects'].map { |project| project['title'] }).to eq(['Usina pública'])
      expect(body['projects'].first['assets'].size).to eq(1)
    end
  end

  describe 'GET /api/v1/companies/:company_id/materials' do
    it 'does not expose draft, expired, or cross-company materials' do
      create(:company_material, company: company, status: 'published', published_at: 1.minute.ago, title: 'Catálogo público')
      create(:company_material, company: company, status: 'draft', title: 'Catálogo rascunho')
      create(:company_material, company: company, status: 'published', published_at: 1.minute.ago, expires_at: 1.minute.ago, title: 'Catálogo expirado')
      create(:company_material, company: other_company, status: 'published', published_at: 1.minute.ago, title: 'Catálogo de outra empresa')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['materials'].map { |material| material['title'] }).to eq(['Catálogo público'])
    end
  end
end
