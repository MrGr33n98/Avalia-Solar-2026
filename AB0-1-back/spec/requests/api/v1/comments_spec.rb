require 'rails_helper'

RSpec.describe 'Api::V1::Comments', type: :request do
  let(:user) { create(:user) }
  let(:publication) { create(:reviewer_publication) }
  let(:jwt_token) { Api::V1::JwtService.encode({ user_id: user.id }) }
  let(:headers) { { 'Authorization' => "Bearer #{jwt_token}" } }

  describe 'GET /api/v1/comments' do
    let!(:comment) do
      Comment.create!(
        user: user,
        commentable: publication,
        body: 'First comment',
        status: 'active'
      )
    end

    it 'returns comments without authentication' do
      get '/api/v1/comments', params: { commentable_type: 'ReviewerPublication', commentable_id: publication.id }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'][0]['body']).to eq('First comment')
    end
  end

  describe 'POST /api/v1/comments' do
    let(:valid_params) do
      {
        commentable_type: 'ReviewerPublication',
        commentable_id: publication.id,
        body: 'This is a test comment'
      }
    end

    context 'when authenticated via JWT' do
      it 'creates a new comment' do
        expect {
          post '/api/v1/comments', params: valid_params, headers: headers
        }.to change(Comment, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['data']['body']).to eq('This is a test comment')
        expect(json['data']['user']['id']).to eq(user.id)
      end
    end

    context 'when unauthenticated' do
      it 'returns 401 Unauthorized' do
        expect {
          post '/api/v1/comments', params: valid_params
        }.not_to change(Comment, :count)

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/comments/:id' do
    let!(:comment) do
      Comment.create!(
        user: user,
        commentable: publication,
        body: 'To be deleted',
        status: 'active'
      )
    end

    context 'when authenticated as the owner' do
      it 'marks the comment as deleted' do
        delete "/api/v1/comments/#{comment.id}", headers: headers
        expect(response).to have_http_status(:ok)
        expect(comment.reload.status).to eq('deleted')
      end
    end

    context 'when unauthenticated' do
      it 'returns 401 Unauthorized' do
        delete "/api/v1/comments/#{comment.id}"
        expect(response).to have_http_status(:unauthorized)
        expect(comment.reload.status).to eq('active')
      end
    end
  end
end
