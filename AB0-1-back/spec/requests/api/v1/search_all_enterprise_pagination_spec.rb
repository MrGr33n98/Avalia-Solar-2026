# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/search/all pagination and facets', type: :request do
  let!(:category) do
    Category.create!(name: "TDD categoria #{SecureRandom.hex(5)}",
                     seo_url: "tdd-categoria-#{SecureRandom.hex(5)}",
                     status: 'active', description: 'Categoria de teste')
  end

  let(:empty_company_results) do
    {
      nodes: [],
      page_info: { current_page: 1, total_pages: 1, total_count: 0, per_page: 24 },
      facets: { categories: [{ key: category.id.to_s, count: 3 }] }
    }
  end

  let(:service) { instance_double(Search::CompanySearchService, call: empty_company_results) }

  it 'passes verified, state, named category and page size to the domain search service' do
    expect(Search::CompanySearchService).to receive(:new).with(hash_including(
      verified: true, state: 'SC', category_id: category.id, page: 2, limit: 12
    )).and_return(service)

    get '/api/v1/search/all', params: {
      q: 'solar', state: 'SC', category: category.name, verified: 'true', page: 2, per_page: 12
    }

    expect(response).to have_http_status(:ok)
    payload = response.parsed_body
    expect(payload.dig('pagination', 'per_page')).to eq(12)
    expect(payload.dig('pagination', 'total_count')).to eq(0)
    expect(payload.dig('facets', 'categories').first).to include(
      'id' => category.id, 'name' => category.name, 'count' => 3
    )
  end

  it 'never returns unfiltered legacy companies when verified filter is active' do
    legacy_company = Company.new(name: 'Not verified')
    legacy_result = { companies: [legacy_company], products: [], categories: [], articles: [], reviews: [] }
    legacy = instance_double(SearchService, call: legacy_result)
    allow(SearchService).to receive(:new).and_return(legacy)
    allow(Search::CompanySearchService).to receive(:new).and_return(service)

    get '/api/v1/search/all', params: { q: 'solar', verified: 'true', per_page: 24 }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body['companies']).to be_empty
  end
end
