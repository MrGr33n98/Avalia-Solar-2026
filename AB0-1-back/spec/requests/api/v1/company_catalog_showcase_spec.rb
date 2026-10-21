# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Catalog Showcase API', type: :request do
  let!(:company) { create(:company, status: :active, name: 'GoodWe Brasil', slug: 'goodwe-brasil') }
  let!(:other_company) { create(:company, status: :active, name: 'Outra Empresa') }

  let!(:category_inverters) { create(:category, name: 'Inversores', seo_url: 'inversores') }
  let!(:category_storage) { create(:category, name: 'Armazenamento', seo_url: 'armazenamento') }
  let!(:category_empty) { create(:category, name: 'Kits', seo_url: 'kits') }

  describe 'GET /api/v1/companies/:id/catalog/showcase' do
    context 'when company has products and services' do
      before do
        # 3 products in Inversores (owned)
        3.times do |i|
          p = create(:product, company: company, status: 'active', name: "Inversor #{i + 1}", sku: "INV-#{i + 1}")
          p.categories << category_inverters
        end

        # 1 product in Armazenamento (linked via active CompanyProduct)
        foreign_storage_product = create(:product, company: other_company, status: 'active', name: 'Bateria Lítio', sku: 'BAT-01')
        foreign_storage_product.categories << category_storage
        CompanyProduct.create!(company: company, product: foreign_storage_product, relationship_type: 'reseller', status: 'active')

        # 1 inactive linked product (should be excluded)
        inactive_product = create(:product, company: other_company, status: 'active', name: 'Produto Inativo', sku: 'INACT-01')
        inactive_product.categories << category_storage
        CompanyProduct.create!(company: company, product: inactive_product, relationship_type: 'reseller', status: 'inactive')

        # 1 draft product (should be excluded)
        draft_p = create(:product, company: company, status: 'draft', name: 'Inversor Rascunho', sku: 'DRAFT-01')
        draft_p.categories << category_inverters

        # 1 service for the company
        CompanyService.create!(
          company: company,
          category: category_inverters,
          name: 'Instalação e Comissionamento',
          slug: 'instalacao-e-comissionamento',
          description: 'Serviço de instalação credenciada',
          price_from: 1500.0,
          status: 'active'
        )

        # 1 inactive service (should be excluded)
        CompanyService.create!(
          company: company,
          category: category_inverters,
          name: 'Serviço Inativo',
          slug: 'servico-inativo',
          status: 'inactive'
        )
      end

      it 'returns 200 with contract compliance, accurate tabs, and max 5 items' do
        get "/api/v1/companies/#{company.id}/catalog/showcase"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.dig('meta', 'contract')).to eq('avalia-solar.catalog.showcase.v1')
        data = json['data']
        expect(data['company_id']).to eq(company.id)
        expect(data['selected_tab']).to eq('all')
        expect(data['max_items']).to eq(5)

        # Tabs verification
        tab_keys = data['tabs'].map { |t| t['key'] }
        expect(tab_keys).to include('all', "category:#{category_inverters.id}", "category:#{category_storage.id}", 'services')
        expect(tab_keys).not_to include("category:#{category_empty.id}")

        all_tab = data['tabs'].find { |t| t['key'] == 'all' }
        expect(all_tab['count']).to eq(5) # 3 owned inverters + 1 linked battery + 1 service

        inverters_tab = data['tabs'].find { |t| t['key'] == "category:#{category_inverters.id}" }
        expect(inverters_tab['count']).to eq(3)

        services_tab = data['tabs'].find { |t| t['key'] == 'services' }
        expect(services_tab['count']).to eq(1)

        # Items verification
        items = data['items']
        expect(items.size).to eq(5)
        item_names = items.map { |i| i['name'] }
        expect(item_names).not_to include('Produto Inativo', 'Inversor Rascunho', 'Serviço Inativo')

        # Discriminated union verification
        product_item = items.find { |i| i['type'] == 'product' }
        expect(product_item).to include(
          'id' => match(/\Aproduct:\d+\z/),
          'type' => 'product',
          'product_id' => be_a(Integer),
          'service_id' => nil,
          'cta' => hash_including('label' => 'Ver produto', 'href' => match(%r{/products/}))
        )

        service_item = items.find { |i| i['type'] == 'service' }
        expect(service_item).to include(
          'id' => match(/\Aservice:\d+\z/),
          'type' => 'service',
          'service_id' => be_a(Integer),
          'product_id' => nil,
          'name' => 'Instalação e Comissionamento',
          'cta' => hash_including('label' => 'Ver serviço', 'href' => match(%r{/companies/goodwe-brasil/services/instalacao-e-comissionamento}))
        )
      end

      it 'filters by specific category tab' do
        get "/api/v1/companies/#{company.id}/catalog/showcase", params: { tab: "category:#{category_storage.id}" }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        data = json['data']

        expect(data['selected_tab']).to eq("category:#{category_storage.id}")
        expect(data['items'].size).to eq(1)
        expect(data['items'].first['name']).to eq('Bateria Lítio')
      end

      it 'filters by services tab' do
        get "/api/v1/companies/#{company.id}/catalog/showcase", params: { tab: 'services' }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        data = json['data']

        expect(data['selected_tab']).to eq('services')
        expect(data['items'].size).to eq(1)
        expect(data['items'].first['type']).to eq('service')
        expect(data['items'].first['name']).to eq('Instalação e Comissionamento')
      end

      it 'enforces maximum limit of 5 items per row' do
        # Add 6 more inverters
        6.times do |i|
          p = create(:product, company: company, status: 'active', name: "Extra Inversor #{i}", sku: "EXTRA-#{i}")
          p.categories << category_inverters
        end

        get "/api/v1/companies/#{company.id}/catalog/showcase", params: { tab: "category:#{category_inverters.id}" }

        json = JSON.parse(response.body)
        expect(json['data']['items'].size).to eq(5)
        expect(json['data']['has_more']).to be true
        expect(json['data']['total_count']).to eq(9)
      end
    end

    context 'when company has no published items' do
      it 'returns empty tabs and items with 200 OK' do
        get "/api/v1/companies/#{company.id}/catalog/showcase"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        data = json['data']

        expect(data['tabs']).to eq([])
        expect(data['items']).to eq([])
        expect(data['total_count']).to eq(0)
        expect(data['has_more']).to be false
      end
    end
  end

  describe 'GET /api/v1/companies/:id/services/:slug' do
    it 'returns the service detail' do
      service = CompanyService.create!(
        company: company,
        category: category_inverters,
        name: 'Suporte Avançado',
        slug: 'suporte-avancado',
        description: 'Suporte técnico 24/7',
        price_from: 499.0,
        status: 'active'
      )

      get "/api/v1/companies/#{company.id}/services/#{service.slug}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'name')).to eq('Suporte Avançado')
      expect(json.dig('data', 'price_from')).to eq(499.0)
    end

    it 'returns 404 for nonexistent service' do
      get "/api/v1/companies/#{company.id}/services/inexistente"

      expect(response).to have_http_status(:not_found)
    end
  end
end
