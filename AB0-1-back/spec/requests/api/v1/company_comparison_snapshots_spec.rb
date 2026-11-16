# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/companies/compare', type: :request do
  let!(:first) { create(:company, name: 'Comparador Um', status: 'active') }
  let!(:second) { create(:company, name: 'Comparador Dois', status: 'active') }
  let!(:inactive) { create(:company, name: 'Oculta', status: 'inactive') }

  it 'returns public snapshots in requested order with canonical terms and no contact PII' do
    first.quote_turnaround = 'within_24h'
    first.financing_availability = 'not_offered'
    first.warranty_years = 5
    first.warranty_confirmed = false
    first.save!

    get '/api/v1/companies/compare', params: { ids: "#{second.id},#{first.id}" }
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.fetch('schema_version')).to eq(1)
    expect(json.fetch('companies').map { |item| item.fetch('id') }).to eq([second.id, first.id])
    expect(json.fetch('missing_ids')).to be_empty

    item = json.fetch('companies').last
    expect(item.fetch('comparison_profile')).to include(
      'quote_turnaround' => 'within_24h',
      'financing_availability' => 'not_offered',
      'warranty_years' => 5,
      'warranty_confirmed' => false
    )
    expect(item).to include('has_paid_plan', 'feature_access', 'quote_cta_enabled')
    expect(item.keys).not_to include('email', 'email_public', 'phone', 'whatsapp', 'cnpj', 'api_key')
    expect(response.headers.fetch('Cache-Control')).to include('no-store')
  end

  it 'omits inactive or nonexistent companies without leaking them' do
    get '/api/v1/companies/compare', params: { ids: "#{first.id},#{inactive.id},999999999" }
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.fetch('companies').map { |item| item.fetch('id') }).to eq([first.id])
    expect(json.fetch('missing_ids')).to eq([inactive.id, 999999999])
  end

  it 'rejects malformed, too long, or unsafe lists before querying' do
    ['', '0', '-1', '1 OR 1=1', '1,2,3,4', '1,,2', '1,abc'].each do |ids|
      get '/api/v1/companies/compare', params: { ids: ids }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  it 'does not duplicate a company when ids repeat' do
    get '/api/v1/companies/compare', params: { ids: "#{first.id},#{first.id}" }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('companies').size).to eq(1)
  end
end
