require 'rails_helper'

RSpec.describe 'Companies cities endpoint', type: :request do
  it 'returns cities for a UF' do
    get '/api/v1/companies/cities', params: { state: 'SP' }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['cities']).to include('São Paulo')
  end

  it 'returns empty list without state' do
    get '/api/v1/companies/cities'

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['cities']).to eq([])
  end
end
