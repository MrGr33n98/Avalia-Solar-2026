require 'rails_helper'

RSpec.describe 'Public company materials API', type: :request do
  let(:company) { create(:company, status: :active) }

  before do
    allow_any_instance_of(Company).to receive(:feature_enabled?).and_return(feature_enabled)
  end

  context 'com materiais habilitados' do
    let(:feature_enabled) { true }

    it 'retorna material publicado' do
      material = create(:company_material, company: company, title: 'Lean', status: 'published', published_at: 1.hour.ago)

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('materials', 0, 'title')).to eq(material.title)
    end
  end

  context 'com materiais desabilitados' do
    let(:feature_enabled) { false }

    it 'não retorna materiais' do
      create(:company_material, company: company, status: 'published', published_at: 1.hour.ago)

      get "/api/v1/companies/#{company.id}/materials"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq('materials' => [])
    end
  end
end
