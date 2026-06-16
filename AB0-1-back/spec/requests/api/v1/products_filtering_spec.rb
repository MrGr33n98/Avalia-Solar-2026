require 'rails_helper'

RSpec.describe 'Api::V1::Products', type: :request do
  let!(:company) { create(:company, status: :active) }
  let!(:other_company) { create(:company, status: :active, name: 'Outra Solar', city: 'Florianopolis', state: 'SC') }
  let!(:category_solar) { create(:category, name: 'Painel Solar', seo_url: 'painel-solar') }
  let!(:category_inverter) { create(:category, name: 'Inversor', seo_url: 'inversor') }
  let!(:brand_weg) { Brand.create!(name: 'WEG', slug: 'weg', status: 'active') }
  let!(:brand_other) { Brand.create!(name: 'Outra Marca', slug: 'outra-marca', status: 'active') }

  let!(:product_cheap) do
    p = create(:product, name: 'Painel Barato', price: 500.0, company: company, brand: brand_weg)
    p.categories << category_solar
    p
  end
  let!(:product_mid) do
    p = create(:product, name: 'Painel Médio', price: 2000.0, company: company, brand: brand_weg)
    p.categories << category_solar
    p
  end
  let!(:product_inverter) do
    p = create(:product, name: 'Inversor Premium', price: 5000.0, company: company, brand: brand_other)
    p.categories << category_inverter
    p
  end
  let!(:product_other_company) do
    create(:product, name: 'Produto Outro', price: 100.0, company: other_company, brand: brand_other)
  end
  let!(:draft_product) { create(:product, name: 'Produto Rascunho', price: 900.0, company: company, status: 'draft') }
  let!(:archived_product) { create(:product, name: 'Produto Arquivado', price: 900.0, company: company, status: 'archived') }

  describe 'GET /api/v1/products' do
    context 'without filters' do
      it 'returns active products with meta' do
        get '/api/v1/products'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(json).to have_key('data')
        expect(json).to have_key('meta')
        expect(json['data'].length).to eq(4)
        expect(json['meta']['total']).to eq(4)
        expect(json['meta']).to include('page', 'per_page', 'total_pages')
        expect(json['meta']['per_page']).to eq(12)
        expect(names).not_to include('Produto Rascunho', 'Produto Arquivado')
      end

      it 'returns the real product payload expected by the catalog' do
        get '/api/v1/products', params: { q: 'painel barato' }

        json = JSON.parse(response.body)
        product = json['data'].first

        expect(product).to include('image_url', 'image_urls', 'brand', 'categories', 'company')
        expect(product['brand']).to include('id' => brand_weg.id, 'name' => 'WEG', 'slug' => 'weg')
        expect(product['categories'].first).to include(
          'id' => category_solar.id,
          'name' => 'Painel Solar',
          'seo_url' => 'painel-solar'
        )
        expect(product['company']).to include(
          'id' => company.id,
          'city' => company.city,
          'state' => company.state
        )
      end
    end

    context 'with text search (q)' do
      it 'filters by product name (case-insensitive)' do
        get '/api/v1/products', params: { q: 'painel' }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to include('Painel Barato', 'Painel Médio')
        expect(names).not_to include('Inversor Premium')
      end

      it 'filters by partial match' do
        get '/api/v1/products', params: { q: 'invers' }

        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to include('Inversor Premium')
        expect(names).not_to include('Painel Barato')
      end

      it 'returns empty data when no match' do
        get '/api/v1/products', params: { q: 'produto_inexistente_xyz_123' }

        json = JSON.parse(response.body)
        expect(json['data']).to be_empty
        expect(json['meta']['total']).to eq(0)
      end

      it 'sanitizes SQL injection attempts' do
        get '/api/v1/products', params: { q: "'; DROP TABLE products; --" }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data']).to be_empty
      end
    end

    context 'with company_id filter' do
      it 'returns only products from that company' do
        get '/api/v1/products', params: { company_id: company.id }

        json = JSON.parse(response.body)
        company_ids = json['data'].map { |p| p['company_id'] }
        expect(company_ids.uniq).to eq([company.id])
        expect(json['meta']['total']).to eq(3)
      end
    end

    context 'with brand_id filter' do
      it 'returns only products from that brand' do
        get '/api/v1/products', params: { brand_id: brand_weg.id }

        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to contain_exactly('Painel Barato', 'Painel Médio')
      end
    end

    context 'with category_id filter' do
      it 'returns only products in that category' do
        get '/api/v1/products', params: { category_id: category_solar.id }

        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to include('Painel Barato', 'Painel Médio')
        expect(names).not_to include('Inversor Premium')
      end
    end

    context 'with price filters' do
      it 'returns products inside the requested price range' do
        get '/api/v1/products', params: { price_min: 400, price_max: 2500 }

        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to include('Painel Barato', 'Painel Médio')
        expect(names).not_to include('Produto Outro', 'Inversor Premium')
      end
    end

    context 'with sort parameter' do
      before do
        # Ensure all products from company are present
        get '/api/v1/products', params: { company_id: company.id, sort: sort_param }
      end

      let(:json) { JSON.parse(response.body) }
      let(:prices) { json['data'].map { |p| p['price'].to_f } }

      context 'price_asc' do
        let(:sort_param) { 'price_asc' }
        it 'returns products sorted by price ascending' do
          expect(prices).to eq(prices.sort)
        end
      end

      context 'price_desc' do
        let(:sort_param) { 'price_desc' }
        it 'returns products sorted by price descending' do
          expect(prices).to eq(prices.sort.reverse)
        end
      end

      context 'name_asc' do
        let(:sort_param) { 'name_asc' }
        it 'returns products sorted alphabetically' do
          names = json['data'].map { |p| p['name'] }
          expect(names).to eq(names.sort)
        end
      end
    end

    context 'with pagination' do
      it 'respects per_page parameter' do
        get '/api/v1/products', params: { per_page: 2, page: 1 }

        json = JSON.parse(response.body)
        expect(json['data'].length).to eq(2)
        expect(json['meta']['per_page']).to eq(2)
        expect(json['meta']['page']).to eq(1)
      end

      it 'returns correct page' do
        # Get page 1 and page 2 with per_page=2
        get '/api/v1/products', params: { per_page: 2, page: 1, sort: 'name_asc' }
        page1_names = JSON.parse(response.body)['data'].map { |p| p['name'] }

        get '/api/v1/products', params: { per_page: 2, page: 2, sort: 'name_asc' }
        page2_names = JSON.parse(response.body)['data'].map { |p| p['name'] }

        expect(page1_names & page2_names).to be_empty
      end

      it 'calculates total_pages correctly' do
        get '/api/v1/products', params: { per_page: 2 }

        json = JSON.parse(response.body)
        total = json['meta']['total']
        per_page = json['meta']['per_page']
        expected_pages = (total.to_f / per_page).ceil

        expect(json['meta']['total_pages']).to eq(expected_pages)
      end

      it 'caps per_page at 100' do
        get '/api/v1/products', params: { per_page: 999 }

        json = JSON.parse(response.body)
        expect(json['meta']['per_page']).to eq(100)
      end

      it 'defaults page to 1 when invalid' do
        get '/api/v1/products', params: { page: 0 }

        json = JSON.parse(response.body)
        expect(json['meta']['page']).to eq(1)
      end
    end

    context 'combining filters' do
      it 'combines q + company_id' do
        get '/api/v1/products', params: { q: 'painel', company_id: company.id }

        json = JSON.parse(response.body)
        names = json['data'].map { |p| p['name'] }
        expect(names).to include('Painel Barato', 'Painel Médio')
        expect(names).not_to include('Inversor Premium')
      end
    end
  end

  describe 'GET /api/v1/products/filters' do
    it 'returns real filter metadata from active catalog data' do
      get '/api/v1/products/filters'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['categories']).to include(
        hash_including(
          'id' => category_solar.id,
          'name' => 'Painel Solar',
          'seo_url' => 'painel-solar',
          'products_count' => 2
        )
      )
      expect(json['companies']).to include(
        hash_including(
          'id' => company.id,
          'name' => company.name,
          'city' => company.city,
          'state' => company.state,
          'products_count' => 3
        )
      )
      expect(json['brands']).to include(
        hash_including('id' => brand_weg.id, 'name' => 'WEG', 'slug' => 'weg', 'products_count' => 2)
      )
      expect(json['price_range']).to eq('min' => 100.0, 'max' => 5000.0)
    end
  end
end
