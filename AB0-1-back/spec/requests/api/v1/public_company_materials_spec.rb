# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public CompanyMaterials API', type: :request do
  let(:company) { create(:company, status: :active) }

  before do
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(true)
  end

  def attach_ready_pdf!(mat)
    asset = build(:digital_asset,
                  attachable: mat,
                  company: mat.company,
                  kind: 'document',
                  status: 'pending',
                  processing_status: 'ready',
                  external_url: nil)
    asset.file.attach(
      io: StringIO.new('%PDF-1.4 test'),
      filename: 'catalogo.pdf',
      content_type: 'application/pdf'
    )
    asset.save!
    asset
  end

  describe 'GET /api/v1/companies/:company_id/materials' do
    it 'retorna materiais publicados' do
      material = create(:company_material, company: company, status: 'draft')
      attach_ready_pdf!(material)
      material.publish!

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['materials'].size).to eq(1)
      expect(body['materials'][0]['id']).to eq(material.id)
      expect(body['materials'][0]['file_available']).to be(true)
    end

    it 'NÃO retorna materiais draft' do
      create(:company_material, company: company, status: 'draft')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['materials']).to eq([])
    end

    it 'NÃO retorna materiais pending' do
      create(:company_material, company: company, status: 'pending')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['materials']).to eq([])
    end

    it 'NÃO retorna materiais rejected' do
      create(:company_material, company: company, status: 'rejected')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['materials']).to eq([])
    end

    it 'NÃO retorna materiais archived' do
      create(:company_material, company: company, status: 'archived')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['materials']).to eq([])
    end

    it 'NÃO retorna materiais expirados' do
      material = create(:company_material, company: company, status: 'draft')
      attach_ready_pdf!(material)
      material.publish!
      material.update_columns(expires_at: 1.day.ago)

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['materials']).to eq([])
    end

    it 'retorna 404 para empresa inexistente' do
      get '/api/v1/companies/999999/materials'

      expect(response).to have_http_status(:not_found)
    end

    it 'retorna [] com flag feature_disabled quando feature desabilitada' do
      allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(false)

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['materials']).to eq([])
      expect(body['feature_disabled']).to be(true)
    end

    it 'retorna 500 quando erro interno (não mascara como [])' do
      allow_any_instance_of(Company).to receive(:company_materials).and_raise(StandardError, 'DB error')

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:internal_server_error)
      body = JSON.parse(response.body)
      expect(body).to have_key('error')
      expect(body).not_to have_key('materials')
    end
  end

  describe 'GET /api/v1/companies/:company_id/materials/:id' do
    it 'retorna material publicado por slug' do
      material = create(:company_material, company: company, status: 'draft', slug: 'catalogo-premium')
      attach_ready_pdf!(material)
      material.publish!

      get "/api/v1/companies/#{company.id}/materials/catalogo-premium"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['material']['slug']).to eq('catalogo-premium')
    end

    it 'retorna 404 para material não publicado' do
      create(:company_material, company: company, status: 'draft', slug: 'rascunho')

      get "/api/v1/companies/#{company.id}/materials/rascunho"

      expect(response).to have_http_status(:not_found)
    end
  end
end
