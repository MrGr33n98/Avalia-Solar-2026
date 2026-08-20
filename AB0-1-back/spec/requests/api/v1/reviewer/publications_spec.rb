# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer publications API', type: :request do
  let(:reviewer) { create(:user, role: 'review', status: :active) }
  let(:other_reviewer) { create(:user, role: 'review', status: :active) }
  let(:headers) do
    token = JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  it 'rejects unauthenticated access' do
    get '/api/v1/reviewer/publications'
    expect(response).to have_http_status(:unauthorized)
  end

  describe 'GET /api/v1/reviewer/publications' do
    it 'lists publications of the current reviewer' do
      create(:reviewer_publication, user: reviewer, title: 'My publication', status: 'draft')
      create(:reviewer_publication, user: other_reviewer, title: 'Other publication', status: 'draft')

      get '/api/v1/reviewer/publications', headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['items'].size).to eq(1)
      expect(payload['items'].first['title']).to eq('My publication')
    end
  end

  describe 'POST /api/v1/reviewer/publications' do
    it 'creates a new publication as draft' do
      params = {
        publication: {
          title: 'Nova Publicacao',
          body: 'Conteudo do artigo...',
          publication_type: 'article',
          category: 'Energia Solar',
          comments_enabled: true
        }
      }

      expect do
        post '/api/v1/reviewer/publications', params: params.to_json, headers: headers
      end.to change(ReviewerPublication, :count).by(1)

      expect(response).to have_http_status(:created)
      payload = JSON.parse(response.body)
      expect(payload['status']).to eq('draft')
    end
  end

  describe 'PATCH /api/v1/reviewer/publications/:id' do
    it 'allows updating drafts and published publications, but rejects archived' do
      pub = create(:reviewer_publication, user: reviewer, status: 'draft')

      # Update draft
      patch "/api/v1/reviewer/publications/#{pub.id}", params: { publication: { title: 'Updated Title' } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      # Publish
      post "/api/v1/reviewer/publications/#{pub.id}/publish", headers: headers
      expect(response).to have_http_status(:ok)

      # Update published
      patch "/api/v1/reviewer/publications/#{pub.id}", params: { publication: { title: 'Second Update' } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)

      # Archive
      post "/api/v1/reviewer/publications/#{pub.id}/archive", headers: headers
      expect(response).to have_http_status(:ok)

      # Update archived (rejected)
      patch "/api/v1/reviewer/publications/#{pub.id}", params: { publication: { title: 'Archived Update' } }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
