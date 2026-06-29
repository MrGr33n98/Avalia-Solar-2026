require 'rails_helper'

RSpec.describe 'Company Dashboard Query Optimization', type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:token) { user.tokens.create.token }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(RoiCalculationWorker).to receive(:perform_async)
    allow(LeadScoringWorker).to receive(:perform_async)
    create(:company_member, user: user, company: company, role: 'owner')
    company.plan.update!(
      name: 'Enterprise',
      price: 499.0,
      features_json: PlanFeatureCatalog.defaults_for_tier('enterprise')
    )
  end

  describe 'intent_summary endpoint' do
    before do
      create_list(:intent_score, 5, company: company)
    end

    it 'returns intent summary with top leads' do
      get "/api/v1/company_dashboard/intent_summary",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to have_key('total_signals')
      expect(json_response).to have_key('avg_confidence')
      expect(json_response).to have_key('intent_distribution')
      expect(json_response).to have_key('top_leads')
      expect(json_response).to have_key('last_updated')
    end

    it 'returns correct intent distribution' do
      get "/api/v1/company_dashboard/intent_summary",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      distribution = json_response['intent_distribution']
      expect(distribution).to have_key('cold')
      expect(distribution).to have_key('warm')
      expect(distribution).to have_key('hot')
      expect(distribution).to have_key('boiling')
      expect(distribution).to have_key('immediate')
      expect(distribution).to have_key('declared')
    end

    it 'limits top leads to 10' do
      create_list(:intent_score, 15, company: company)
      
      get "/api/v1/company_dashboard/intent_summary",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response['top_leads'].length).to be <= 10
    end

    it 'includes lead technical profile data' do
      score = create(:intent_score, company: company)
      lead = create(:lead, id: score.lead_id) if score.lead_id.present?

      get "/api/v1/company_dashboard/intent_summary",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      if json_response['top_leads'].any?
        lead_data = json_response['top_leads'].first
        expect(lead_data).to have_key('technical_profile')
        expect(lead_data).to have_key('marketing_data')
      end
    end
  end

  describe 'social_proof_reviews endpoint' do
    before do
      create_list(:review, 5, company: company)
    end

    it 'returns reviews with minimal data' do
      get "/api/v1/company_dashboard/social_proof_reviews",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response).to have_key('reviews')
      expect(json_response).to have_key('permissions')
    end

    it 'includes required review fields' do
      get "/api/v1/company_dashboard/social_proof_reviews",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      if json_response['reviews'].any?
        review = json_response['reviews'].first
        expect(review).to have_key('id')
        expect(review).to have_key('rating')
        expect(review).to have_key('comment')
        expect(review).to have_key('user_name')
        expect(review).to have_key('status')
        expect(review).to have_key('featured')
      end
    end

    it 'orders reviews by created_at descending' do
      create_list(:review, 3, company: company)

      get "/api/v1/company_dashboard/social_proof_reviews",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      if json_response['reviews'].length > 1
        timestamps = json_response['reviews'].map { |r| r['created_at'] }
        expect(timestamps).to eq(timestamps.sort.reverse)
      end
    end

    it 'includes permissions in response' do
      get "/api/v1/company_dashboard/social_proof_reviews",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      permissions = json_response['permissions']
      expect(permissions).to have_key('can_feature_reviews')
      expect(permissions).to have_key('social_proof_enabled')
      expect(permissions).to have_key('featured_limit')
    end

    it 'returns reviews whose reviewer name is stored only in metadata' do
      metadata_review = create(
        :review,
        company: company,
        user: nil,
        capture_flow_source: 'qr_code_form',
        metadata: {
          reviewer_name: 'Cliente Solar',
          lgpd_consent: true
        }
      )

      get "/api/v1/company_dashboard/social_proof_reviews",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      returned_review = json_response.fetch('reviews').find { |review| review['id'] == metadata_review.id }

      expect(json_response['data_status']).to eq('complete')
      expect(returned_review).to include(
        'user_name' => 'Cliente Solar',
        'capture_flow_source' => 'qr_code_form'
      )
    end
  end

  describe 'social_proof_stats endpoint' do
    it 'returns diagnostic coverage without inventing unavailable data' do
      category = create(:category)
      approved_review = create(
        :review,
        company: company,
        category: category,
        capture_flow_source: 'qr_code_form',
        status: :approved,
        verified: true,
        sentiment: 'positive',
        nps_score: 10,
        reply: 'Obrigado pelo feedback.'
      )
      criterion = create(:rating_criterion, category: category)
      create(:review_criterion_score, review: approved_review, rating_criterion: criterion, score: 4.5)

      get "/api/v1/company_dashboard/social_proof_stats",
          headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      stats = json_response.fetch('stats')

      expect(json_response['data_status']).to eq('complete')
      expect(stats).to include(
        'approved_reviews' => 1,
        'verified_reviews' => 1,
        'response_rate' => 100,
        'nps_score' => 100,
        'nps_responses' => 1
      )
      expect(stats.dig('sentiment_distribution', 'positive')).to eq(1)
      expect(stats.dig('source_distribution', 'qr_code_form')).to eq(1)
      expect(stats.fetch('criteria_averages').first).to include(
        'title' => criterion.title,
        'average' => 4.5,
        'responses' => 1
      )
    end
  end
end

