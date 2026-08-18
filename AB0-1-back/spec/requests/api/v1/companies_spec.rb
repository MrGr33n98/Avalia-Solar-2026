require 'rails_helper'

RSpec.describe 'GET /api/v1/companies', type: :request do
  let!(:residential) do
    create(
      :category,
      name: 'Residencial',
      slug: 'residencial',
      seo_url: 'residencial'
    )
  end
  let!(:industrial) do
    create(
      :category,
      name: 'Industrial',
      slug: 'industrial',
      seo_url: 'industrial'
    )
  end
  let!(:nearby_company) do
    create(
      :company,
      status: :active,
      name: 'Solar São Paulo',
      state: 'SP',
      city: 'São Paulo',
      verified: true,
      featured: true,
      rating_avg: 4.8,
      rating_count: 12,
      whatsapp_enabled: true,
      financing_enabled: true,
      latitude: -23.5505,
      longitude: -46.6333
    ).tap { |company| company.categories << residential }
  end
  let!(:distant_company) do
    create(
      :company,
      status: :active,
      name: 'Solar Rio',
      state: 'RJ',
      city: 'Rio de Janeiro',
      verified: false,
      featured: false,
      rating_avg: 3.5,
      rating_count: 2,
      whatsapp_enabled: false,
      financing_enabled: false,
      latitude: -22.9068,
      longitude: -43.1729
    ).tap { |company| company.categories << industrial }
  end
  let!(:inactive_company) { create(:company, status: :inactive, state: 'SP', city: 'São Paulo') }

  before do
    Rails.cache.clear
  end

  it 'aplica filtros simples de status, verificação, avaliação, categoria e recursos' do
    get '/api/v1/companies', params: {
      page: 1,
      per_page: 10,
      status: 'active',
      verified: true,
      min_rating: 4.0,
      category_ids: residential.id,
      whatsapp_enabled: true,
      financing_enabled: true
    }

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('data').map { |company| company['id'] }).to contain_exactly(nearby_company.id)
  end

  it 'combina busca, estado, cidade e ordenação por distância' do
    get '/api/v1/companies', params: {
      page: 1,
      per_page: 10,
      q: 'Solar',
      state: 'SP',
      city: 'São Paulo',
      sort: 'distance',
      lat: -23.5505,
      lng: -46.6333
    }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload.fetch('data').map { |company| company['id'] }).to eq([nearby_company.id])
    expect(payload.fetch('data').first['distance_km']).to be_present
  end

  it 'combina filtros de atendimento e localização por raio' do
    get '/api/v1/companies', params: {
      page: 1,
      per_page: 10,
      state: 'SP',
      city: 'São Paulo',
      radius_km: 50,
      lat: -23.5505,
      lng: -46.6333,
      whatsapp_enabled: true,
      financing_enabled: true
    }

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('data').map { |company| company['id'] }).to contain_exactly(nearby_company.id)
  end

  it 'ignora geo inválida e mantém resposta paginada independente de per_page' do
    get '/api/v1/companies', params: { page: 1, per_page: 1, sort: 'distance', lat: 91, lng: -200 }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload.dig('meta', 'pagination', 'per_page')).to eq(1)
    expect(response.headers['X-Per-Page']).to eq('1')
    expect(payload.fetch('data').length).to eq(1)
  end

  it 'retorna estados e cidades para filtros manuais' do
    get '/api/v1/companies/states'
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('states')).to include('SP')

    get '/api/v1/companies/cities', params: { state: 'SP' }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('cities')).to be_an(Array)
  end
end