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
      expect(json.dig('company', 'allows_competitor_suggestions')).to eq(true)
      expect(json.dig('category', 'id')).to eq(category.id)
      expect(json['products'].map { |product| product['id'] }).to contain_exactly(global_product.id)
      expect(json['services'].map { |service| service['slug'] }).to contain_exactly('instalacao-de-wallbox')
      expect(json['suggested_products']).to eq([])
      expect(json['related_categories']).to eq([])
      expect(json['similar_companies']).to eq([])
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

    context 'when the requested category is empty' do
      let!(:empty_category) { create(:category, name: 'Carregadores Residenciais', seo_url: 'carregadores-residenciais') }
      let!(:suggested_product) do
        create(:product, name: 'Weg Inversor', company: company).tap do |product|
          product.categories << other_category
        end
      end

      before do
        company.categories << empty_category
        company.categories << other_category
      end

      it 'returns suggested products from other categories of the same company' do
        get "/api/v1/companies/#{company.id}/catalog", params: { category: empty_category.seo_url }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['products']).to be_empty
        expect(json['services']).to be_empty
        expect(json['suggested_products'].map { |p| p['id'] }).to contain_exactly(suggested_product.id)
        expect(json['related_categories'].map { |c| c['seo_url'] }).to include(other_category.seo_url)
      end

      it 'does not return similar companies for verified/premium sellers' do
        company.update!(verified: true)

        get "/api/v1/companies/#{company.id}/catalog", params: { category: empty_category.seo_url }

        json = JSON.parse(response.body)
        expect(json['similar_companies']).to be_empty
      end
    end

    context 'when no products exist anywhere in the company' do
      let!(:empty_category) { create(:category, name: 'Carregadores Residenciais', seo_url: 'carregadores-residenciais') }
      let!(:competitor_product) do
        create(:product, name: 'Concorrente Wallbox', company: other_company).tap do |product|
          product.categories << empty_category
        end
      end

      before do
        company.categories << empty_category
      end

      it 'returns similar companies for free sellers' do
        get "/api/v1/companies/#{company.id}/catalog", params: { category: empty_category.seo_url }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['products']).to be_empty
        expect(json['suggested_products']).to be_empty
        expect(json['similar_companies'].map { |c| c['id'] }).to include(other_company.id)
      end
    end
  end
end
