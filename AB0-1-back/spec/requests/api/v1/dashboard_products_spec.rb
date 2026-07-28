# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Dashboard product catalog', type: :request do
  let(:company) { create(:company, status: :active) }
  let(:user) { create(:user, company: company, status: :active, approved_by_admin: true, confirmed_at: Time.current) }
  let(:other_company) { create(:company, status: :active) }
  let(:category) { create(:category, name: 'Inversores') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'ACCEPT' => 'application/json' } }

  before do
    create(:company_member, company: company, user: user, role: 'owner', status: 'active')
  end

  describe 'GET /api/v1/dashboard/products' do
    it 'returns only products owned by the authenticated company with real catalog metadata' do
      product = create(:product, company: company, status: 'active', stock: 4)
      product.categories << category
      create(:product, company: other_company, status: 'active')

      get '/api/v1/dashboard/products', headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].map { |item| item['id'] }).to contain_exactly(product.id)
      expect(body['data'].first).to include('categories', 'image_urls', 'images_count', 'specifications_count', 'completeness')
      expect(body.dig('meta', 'stats')).to include('published' => 1, 'total' => 1)
    end
  end

  describe 'POST /api/v1/dashboard/products' do
    it 'creates a product for the authenticated company and persists its category' do
      post '/api/v1/dashboard/products', params: {
        product: {
          name: 'Inversor WEG 10kW', sku: 'WEG-INV-10', description: 'Inversor trifásico para sistemas comerciais.',
          price: 12_450, stock: 7, status: 'draft', category_ids: [category.id]
        }
      }, headers: headers

      expect(response).to have_http_status(:created)
      product = Product.find_by!(sku: 'WEG-INV-10')
      expect(product.company).to eq(company)
      expect(product.categories).to include(category)
      expect(JSON.parse(response.body).dig('product', 'status')).to eq('draft')
    end
  end

  describe 'PATCH and DELETE /api/v1/dashboard/products/:id' do
    it 'updates its own product and archives it instead of deleting its history' do
      product = create(:product, company: company, status: 'draft')

      patch "/api/v1/dashboard/products/#{product.id}", params: {
        product: { name: 'Produto atualizado', sku: product.sku, description: 'Descrição atualizada do produto.', price: 1500, status: 'active' }
      }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(product.reload).to have_attributes(name: 'Produto atualizado', status: 'active')

      delete "/api/v1/dashboard/products/#{product.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(product.reload.status).to eq('archived')
    end

    it 'does not allow one company to mutate another company product' do
      foreign_product = create(:product, company: other_company)

      patch "/api/v1/dashboard/products/#{foreign_product.id}", params: { product: { name: 'Alteração indevida' } }, headers: headers

      expect(response).to have_http_status(:not_found)
      expect(foreign_product.reload.name).not_to eq('Alteração indevida')
    end
  end
end
