require 'rails_helper'

RSpec.describe 'Api::V1::Reviews', type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:category) { create(:category) }
  let(:rating_criterion) { create(:rating_criterion) }

  before do
    # Simulate authentication by bypassing actual JWT check for test simplicity if there is a helper,
    # or assuming standard Devise auth. We'll use sign_in if standard Devise.
    # We will stub the authentication if there's an authenticate_api_user method.
    allow_any_instance_of(Api::V1::BaseController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(user)
  end

  describe 'POST /api/v1/reviews' do
    let(:valid_payload) do
      {
        review: {
          company_id: company.id,
          category_id: category.id,
          rating: 5,
          headline: 'Ótima empresa',
          comment: 'Experiência detalhada muito boa.',
          pros: ['Atendimento teste'],
          cons: ['preço'],
          buyer_tip: 'Negocie o preço.',
          project_type: 'residential',
          installation_status: 'completed',
          capture_flow_source: 'profile',
          review_criterion_scores_attributes: [
            {
              rating_criterion_id: rating_criterion.id,
              score: 5
            }
          ],
          review_media_ids: []
        }
      }
    end

    it 'creates a review successfully and returns 201' do
      expect {
        post '/api/v1/reviews', params: valid_payload, as: :json
      }.to change(Review, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['rating']).to eq(5.0)
    end

    context 'when providing a not_applicable criterion with nil score' do
      let(:payload_with_na) do
        valid_payload.tap do |p|
          p[:review][:review_criterion_scores_attributes] = [
            {
              rating_criterion_id: rating_criterion.id,
              not_applicable: true,
              score: nil
            }
          ]
        end
      end

      it 'creates the review without raising 500' do
        expect {
          post '/api/v1/reviews', params: payload_with_na, as: :json
        }.to change(Review, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context 'when downstream services fail' do
      before do
        allow(Analytics::PostHogService).to receive(:capture).and_raise(StandardError, 'PostHog Timeout')
      end

      it 'still creates the review and returns 201 (Failure Isolation)' do
        expect {
          post '/api/v1/reviews', params: valid_payload, as: :json
        }.to change(Review, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context 'when submitting a duplicate review' do
      before do
        create(:review, user: user, company: company, category_id: category.id)
      end

      it 'returns 422 Unprocessable Entity' do
        post '/api/v1/reviews', params: valid_payload, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors']).to include(/Você já avaliou/)
      end
    end

    context 'when validation fails' do
      let(:invalid_payload) do
        valid_payload.tap do |p|
          p[:review][:rating] = 6 # invalid
        end
      end

      it 'returns 422 Unprocessable Entity' do
        post '/api/v1/reviews', params: invalid_payload, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end
end
