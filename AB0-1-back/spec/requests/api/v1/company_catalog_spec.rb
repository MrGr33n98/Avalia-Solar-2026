require 'rails_helper'

RSpec.describe 'Api::V1::CompanyCatalog', type: :request do
  let!(:company) { create(:company, status: :active) }
  let!(:other_company) { create(:company, status: :active) }
  let!(:category) { create(:category, name: 'Carregadores Veiculares', seo_url: 'carregadores-veiculares') }
  let!(:other_category) { create(:category, name: 'Baterias', seo_url: 'baterias') }

  let!(:global_product) do
    create(:product, name: 'Wallbox Global', company: other_company).tap do |product|
      product.categories << category
    end
  end

  before do
    company.categories << category
    CompanyProduct.create!(
      company: company,
      product: global_product,
      relationship_type: 'distributor',
      status: 'active'
    )
    CompanyService.create!(
      company: company,
      category: category,
      name: 'Instalação de wallbox',
      slug: 'instalacao-de-wallbox',
      status: 'active'
    )
  end

  describe 'GET /api/v1/companies/:id/catalog' do
    it 'returns globally canonical products linked to the company in the selected category' do
      get "/api/v1/companies/#{company.id}/catalog", params: { category: category.seo_url }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json.dig('company', 'id')).to eq(company.id)
      expect(json.dig('category', 'id')).to eq(category.id)
      expect(json['products'].map { |product| product['id'] }).to contain_exactly(global_product.id)
      expect(json['services'].map { |service| service['slug'] }).to contain_exactly('instalacao-de-wallbox')
    end

    it 'does not expose a category that is not associated with the company' do
      get "/api/v1/companies/#{company.id}/catalog", params: { category: other_category.seo_url }

      expect(response).to have_http_status(:not_found)
    end

    it 'returns a structured error without exposing implementation details' do
      allow(Product).to receive(:active_status).and_raise(StandardError, 'database detail')

      get "/api/v1/companies/#{company.id}/catalog", params: { category: category.seo_url }

      expect(response).to have_http_status(:internal_server_error)
      expect(JSON.parse(response.body)).to include(
        'error' => 'Catalog temporarily unavailable',
        'code' => 'CATALOG_UNAVAILABLE'
      )
      expect(response.body).not_to include('database detail')
    end
  end
end
