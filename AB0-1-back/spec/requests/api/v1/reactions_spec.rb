require 'rails_helper'

RSpec.describe 'Api::V1::Reactions', type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:category) { create(:category) }
  let(:reviewer_profile) { create(:reviewer_profile, user: user) }
  let(:review) { create(:review, user: user, company: company, category: category) }
  
  describe 'POST /api/v1/reactions' do
    context 'when authenticated via JWT' do
      let(:headers) { auth_headers_for(user) }

      it 'creates a reaction and returns 200' do
        post '/api/v1/reactions', params: { reactable_type: 'Review', reactable_id: review.id, reaction_type: 'useful' }, headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_body['status']).to eq('success')
        expect(json_body['data']['reaction_type']).to eq('useful')
        expect(Reaction.count).to eq(1)
      end
    end

    context 'when not authenticated' do
      it 'returns 401 Unauthorized' do
        post '/api/v1/reactions', params: { reactable_type: 'Review', reactable_id: review.id, reaction_type: 'useful' }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/reactions' do
    context 'when authenticated via JWT' do
      let(:headers) { auth_headers_for(user) }
      let!(:reaction) { create(:reaction, user: user, reactable: review, reaction_type: 'useful') }

      it 'deletes a reaction and returns 200' do
        delete '/api/v1/reactions', params: { reactable_type: 'Review', reactable_id: review.id }, headers: headers

        expect(response).to have_http_status(:ok)
        expect(json_body['status']).to eq('success')
        expect(Reaction.count).to eq(0)
      end
    end
  end
end
