require 'rails_helper'

RSpec.describe 'Favorites API', type: :request do
  let(:user) { create(:user, city: 'Florianópolis', state: 'SC') }
  let(:other_user) { create(:user, city: 'São Paulo', state: 'SP') }
  let(:token) { JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  it 'exige autenticação' do
    get '/api/v1/favorites'
    expect(response).to have_http_status(:unauthorized)
  end

  it 'cria e lista Company somente para usuário atual' do
    company = create(:company)
    create(:favorite, user: other_user, favoritable: create(:company))

    post '/api/v1/favorites', params: { favoritable_type: 'Company', favoritable_id: company.id }.to_json, headers: headers
    expect(response).to have_http_status(:created)

    get '/api/v1/favorites', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('data').map { |item| item.fetch('item').fetch('id') }).to eq([company.id])
  end

  it 'torna criação duplicada idempotente' do
    company = create(:company)
    payload = { favoritable_type: 'Company', favoritable_id: company.id }.to_json

    post '/api/v1/favorites', params: payload, headers: headers
    post '/api/v1/favorites', params: payload, headers: headers

    expect(response).to have_http_status(:created).or have_http_status(:ok)
    expect(user.favorites.count).to eq(1)
  end

  it 'rejeita tipo inválido e item inexistente' do
    post '/api/v1/favorites', params: { favoritable_type: 'User', favoritable_id: user.id }.to_json, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).fetch('code')).to eq('FAVORITE_INVALID_TYPE')

    post '/api/v1/favorites', params: { favoritable_type: 'Company', favoritable_id: -1 }.to_json, headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'remove favorito próprio por id e por item' do
    company = create(:company)
    favorite = create(:favorite, user: user, favoritable: company)

    delete "/api/v1/favorites/#{favorite.id}", headers: headers
    expect(response).to have_http_status(:no_content)

    delete '/api/v1/favorites/by_item', params: { favoritable_type: 'Company', favoritable_id: company.id }.to_json, headers: headers
    expect(response).to have_http_status(:no_content)
  end

  it 'não remove favorito de outro usuário' do
    favorite = create(:favorite, user: other_user)
    delete "/api/v1/favorites/#{favorite.id}", headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'retorna status em lote e rejeita mais de 100 IDs' do
    company = create(:company)
    create(:favorite, user: user, favoritable: company)

    get '/api/v1/favorites/status', params: { type: 'Company', ids: [company.id, company.id + 1] }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('favorites').fetch(company.id.to_s)).to be(true)

    get '/api/v1/favorites/status', params: { type: 'Company', ids: (1..101).to_a }, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
  end
end
