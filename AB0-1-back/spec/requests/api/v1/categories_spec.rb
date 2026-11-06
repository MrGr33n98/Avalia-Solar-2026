require 'rails_helper'

RSpec.describe 'Api::V1::Categories', type: :request do
  let(:category) { create(:category, status: 'active', seo_url: 'inversores-solares', name: 'Inversores') }

  describe 'GET /api/v1/categories/by_slug/:slug (CDSI-011, CDSI-017)' do
    it 'R01: returns 200 for an active category without synchronous views_count write on GET' do
      active_cat = create(:category, status: 'active', seo_url: 'monitoramento-operacao-manutencao', views_count: 10)

      expect do
        get '/api/v1/categories/by_slug/monitoramento-operacao-manutencao'
      end.not_to(change { active_cat.reload.views_count })

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(active_cat.id)
      expect(json['seo_url']).to eq('monitoramento-operacao-manutencao')
    end

    it 'R02: returns 404 for a nonexistent category slug' do
      get '/api/v1/categories/by_slug/categoria-que-nao-existe'

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['error']).to be_present
    end

    it 'R03: returns 404 for an inactive category slug and excludes inactive children/parents' do
      inactive_cat = create(:category, status: 'inactive', seo_url: 'categoria-inativa', name: 'Inativa')
      parent_active = create(:category, status: 'active', seo_url: 'energia-solar', name: 'Energia Solar')
      active_child = create(:category, status: 'active', seo_url: 'paineis-solares', name: 'Painéis Solares', parent: parent_active)
      inactive_child = create(:category, status: 'inactive', seo_url: 'sub-inativa', name: 'Sub Inativa', parent: parent_active)

      get "/api/v1/categories/by_slug/#{inactive_cat.seo_url}"
      expect(response).to have_http_status(:not_found)

      get "/api/v1/categories/by_slug/#{parent_active.seo_url}"
      expect(response).to have_http_status(:ok)
      parent_json = JSON.parse(response.body)
      sub_slugs = Array(parent_json['subcategories']).map { |s| s['seo_url'] }
      expect(sub_slugs).to include(active_child.seo_url)
      expect(sub_slugs).not_to include(inactive_child.seo_url)

      get '/api/v1/categories'
      expect(response).to have_http_status(:ok)
      index_ids = JSON.parse(response.body).map { |c| c['id'] }
      expect(index_ids).to include(parent_active.id)
      expect(index_ids).not_to include(inactive_cat.id)
      expect(index_ids).not_to include(inactive_child.id)
    end

    it 'R04: returns 500 without leaking internal exception details on unexpected failure' do
      allow(Category).to receive(:active).and_raise(StandardError.new('PG::ConnectionBad: secret host 10.0.0.9'))

      get '/api/v1/categories/by_slug/inversores-solares'

      expect(response).to have_http_status(:internal_server_error)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Erro interno no servidor')
      expect(json['details']).to be_nil
      expect(response.body).not_to include('PG::ConnectionBad')
    end

    it 'R08: rejects malformed or traversal slugs with 404' do
      get '/api/v1/categories/by_slug/..%2Fadmin'
      expect(response).to have_http_status(:not_found)

      get '/api/v1/categories/by_slug/slug%20invalido%20com%20espaco'
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/categories/:id/evaluation_context' do
    context 'with granular criteria' do
      let!(:criterion) { create(:rating_criterion, category: category, title: 'Atendimento', slug: 'atendimento') }

      it 'returns the evaluation context' do
        get "/api/v1/categories/#{category.id}/evaluation_context"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['category_id']).to eq(category.id)
        expect(json['has_granular_criteria']).to be true
        expect(json['criteria'].first['slug']).to eq('atendimento')
      end
    end

    context 'without granular criteria' do
      it 'returns empty criteria list' do
        get "/api/v1/categories/#{category.id}/evaluation_context"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['category_id']).to eq(category.id)
        expect(json['has_granular_criteria']).to be false
        expect(json['criteria']).to be_empty
      end
    end
  end
end
