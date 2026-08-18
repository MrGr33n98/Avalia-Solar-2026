require 'rails_helper'

RSpec.describe 'Creators API', type: :request do
  let(:user) do
    create(:user, role: 'review', status: :active, city: 'Florianópolis', state: 'SC', confirmed_at: Time.current)
  end
  let!(:profile) do
    create(
      :reviewer_profile,
      user: user,
      public_slug: 'creator-api-spec',
      creator_enabled: true,
      public_headline: 'Especialista solar',
      public_bio: 'Experiência em energia solar.'
    )
  end

  it 'retorna creator ativo com avaliações e estrutura pública' do
    company = create(:company, name: 'Solar Empresa', slug: 'solar-empresa')
    create(:review, user: user, company: company, status: :approved, comment: 'Ótimo atendimento.')

    get '/api/v1/creators/creator-api-spec'

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload).to include('creator', 'stats', 'recent_publications', 'recent_reviews', 'solutions', 'achievements')
    expect(payload.fetch('recent_reviews').first).to include('user', 'company')
  end

  it 'retorna 200 para creator sem avaliações' do
    get '/api/v1/creators/creator-api-spec'

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('recent_reviews')).to eq([])
  end

  it 'retorna 404 para creator inexistente' do
    get '/api/v1/creators/nao-existe'

    expect(response).to have_http_status(:not_found)
  end
end