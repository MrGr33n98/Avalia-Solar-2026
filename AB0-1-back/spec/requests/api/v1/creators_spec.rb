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

  describe 'GET /api/v1/creators/:slug/followers' do
    let(:follower_user) { create(:user, name: 'Follower User', role: 'review', status: :active) }
    let!(:reviewer_profile_follower) { create(:reviewer_profile, user: follower_user, public_slug: 'follower-slug') }

    before do
      SocialFollow.create!(follower: follower_user, followable: profile)
    end

    it 'retorna a lista de seguidores com cursor pagination' do
      get '/api/v1/creators/creator-api-spec/followers'

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['data'].first['name']).to eq('Follower User')
      expect(payload['data'].first['public_slug']).to eq('follower-slug')
      expect(payload['data'].first['followable_id']).to eq(reviewer_profile_follower.id)
      expect(payload['data'].first['type']).to eq('ReviewerProfile')
      expect(payload['meta']).to include('next_cursor', 'has_more')
    end

    it 'resolve estado following em lote, sem exists por item' do
      viewer = create(:user, role: 'review', status: :active)
      viewer_token = JWT.encode(
        { user_id: viewer.id, typ: 'access' },
        Rails.application.secret_key_base,
        'HS256'
      )
      viewer_headers = { 'Authorization' => "Bearer #{viewer_token}" }

      3.times do |index|
        follower = create(:user, name: "Follower #{index}", role: 'review', status: :active)
        create(:reviewer_profile, user: follower, public_slug: "follower-#{index}")
        SocialFollow.create!(follower: follower, followable: profile)
      end

      sql_queries = capture_sql do
        get '/api/v1/creators/creator-api-spec/followers', headers: viewer_headers
      end

      expect(response).to have_http_status(:ok)
      expect(sql_queries.grep(/SELECT 1 AS one FROM "social_follows"/)).to be_empty
    end
  end

  describe 'GET /api/v1/creators/:slug/following' do
    let(:followed_company) { create(:company, name: 'Empresa Seguida') }

    before do
      SocialFollow.create!(follower: user, followable: followed_company)
    end

    it 'retorna a lista de entidades seguidas' do
      get '/api/v1/creators/creator-api-spec/following'

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['data'].first['name']).to eq('Empresa Seguida')
      expect(payload['data'].first['type']).to eq('Company')
      expect(payload['meta']).to include('next_cursor', 'has_more')
    end
  end

  def capture_sql
    queries = []
    subscriber = ActiveSupport::Notifications.subscribe('sql.active_record') do |*, payload|
      queries << payload[:sql]
    end

    yield
    queries
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end
end
