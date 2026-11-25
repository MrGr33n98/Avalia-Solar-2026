# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/companies/count', type: :request do
  before { Rails.cache.clear }

  it 'matches the public company index for the same location filters' do
    create(:company, name: 'Contagem SC ativa', status: 'active', state: 'SC', city: 'Florianopolis')
    create(:company, name: 'Contagem MG ativa', status: 'active', state: 'MG', city: 'Belo Horizonte')
    create(:company, name: 'Contagem SC inativa', status: 'inactive', state: 'SC', city: 'Florianopolis')

    filters = { state: ['SC'], city: ['Florianopolis'] }

    get '/api/v1/companies/count', params: filters
    expect(response).to have_http_status(:ok)
    count = JSON.parse(response.body).fetch('count')

    get '/api/v1/companies', params: filters.merge(fields: 'card')
    expect(response).to have_http_status(:ok)
    companies = JSON.parse(response.body)

    expect(count).to eq(companies.length)
  end
end
