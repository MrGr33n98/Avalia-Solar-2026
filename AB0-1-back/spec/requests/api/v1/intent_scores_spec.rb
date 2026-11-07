require 'rails_helper'

RSpec.describe 'Intent scores API', type: :request do
  let(:company) { create(:company, intent_tier: 'pro') }
  let(:user) { create(:user, company: company) }
  let(:token) do
    JWT.encode(
      { user_id: user.id, typ: 'access', exp: 1.day.from_now.to_i },
      Rails.application.secret_key_base,
      'HS256'
    )
  end
  let(:headers) do
    {
      'ACCEPT' => 'application/json',
      'Authorization' => "Bearer #{token}"
    }
  end

  let!(:warm_score) do
    create(
      :intent_score,
      company: company,
      anonymous_id: 'anon-warm',
      total_score: 45,
      last_interaction_at: 2.hours.ago
    )
  end

  let!(:immediate_score) do
    create(
      :intent_score,
      company: company,
      anonymous_id: 'anon-immediate',
      total_score: 82,
      last_interaction_at: 30.minutes.ago
    )
  end

  describe 'GET /api/v1/intent_scores' do
    it 'returns ranked scores for the requested company' do
      get '/api/v1/intent_scores', params: { company_id: company.id }, headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['total']).to eq(2)
      expect(body['scores'].map { |score| score['total_score'] }).to eq([82, 45])
    end
  end

  describe 'GET /api/v1/intent_scores/reporting' do
    it 'counts only persisted events in the selected period, without conflating pricing with profile views' do
      {
        'profile_view' => 'research_intent',
        'pricing_interaction' => 'financial_intent',
        'comparison_view' => 'research_intent',
        'review_read' => 'research_intent'
      }.each do |kind, category|
        BuyerIntentActivity.create!(
          company: company, anonymous_id: 'anon-warm', session_id: 'session-warm',
          signal_type: kind, signal_category: category,
          page_path: '/companies/test', tracked_at: 1.day.ago
        )
      end
      BuyerIntentActivity.create!(
        company: company, anonymous_id: 'anon-warm', session_id: 'session-old',
        signal_type: 'profile_view', signal_category: 'research_intent',
        page_path: '/companies/test', tracked_at: 70.days.ago
      )

      get '/api/v1/intent_scores/reporting',
          params: { company_id: company.id, days: 30 }, headers: headers

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.dig('traffic_ratio', 'direct_pageviews')).to eq(1)
      expect(data.dig('traffic_ratio', 'competitive_pageviews')).to eq(1)
      expect(data.dig('traffic_ratio', 'total_intent_signals')).to eq(4)
      expect(data.dig('section_breakdown', 'reviews', 'count')).to eq(1)
      expect(data.dig('section_breakdown', 'portfolio', 'status')).to eq('partial')
      expect(data['top_competitors_compared']).to eq([])
    end

    it 'returns top_competitors_compared extracted from comparison metadata' do
      competitor = create(:company, name: 'Concorrente Solar Alpha', slug: 'concorrente-alpha')

      BuyerIntentActivity.create!(
        company: company,
        anonymous_id: 'anon-compare',
        session_id: 'session-compare',
        signal_type: 'comparison_view',
        signal_category: 'research_intent',
        page_path: '/compare',
        tracked_at: 2.hours.ago,
        metadata: {
          'compared_company_ids' => [company.id, competitor.id]
        }
      )

      get '/api/v1/intent_scores/reporting',
          params: { company_id: company.id, days: 30 }, headers: headers

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data['top_competitors_compared']).to be_an(Array)
      expect(data['top_competitors_compared'].size).to eq(1)

      top_comp = data['top_competitors_compared'].first
      expect(top_comp['id']).to eq(competitor.id)
      expect(top_comp['name']).to eq('Concorrente Solar Alpha')
      expect(top_comp['slug']).to eq('concorrente-alpha')
      expect(top_comp['comparisons_count']).to eq(1)
      expect(top_comp['percentage']).to eq(100)
    end

    it 'rejects periods longer than one year' do
      get '/api/v1/intent_scores/reporting',
          params: { company_id: company.id, days: 9999 }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET /api/v1/intent_scores/:id' do
    it 'returns a real timeline and does not invent a buyer organization' do
      activity = BuyerIntentActivity.create!(
        company: company, anonymous_id: 'anon-warm', session_id: 'session-warm',
        signal_type: 'review_read', signal_category: 'research_intent',
        page_path: '/companies/test', tracked_at: Time.current
      )

      get "/api/v1/intent_scores/#{warm_score.id}", headers: headers

      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data['identity_status']).to eq('unverified')
      expect(data['location']).to eq('Não verificada')
      expect(data['timeline'].map { |event| event['id'] }).to include(activity.id)
      expect(data['account_name']).to start_with('Sessão de pesquisa')
    end
  end

  describe 'GET /api/v1/intent_scores/summary' do
    it 'returns the level breakdown for the requested company' do
      get '/api/v1/intent_scores/summary', params: { company_id: company.id }, headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['breakdown']['warm']).to eq(1)
      expect(body['breakdown']['boiling']).to eq(1)
      expect(body['actionable_count']).to eq(1)
    end
  end
end
