# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Feed', type: :request do
  describe 'GET /api/v1/feed' do
    let(:user) { create(:user) }
    let(:creator) { create(:user) }
    let!(:creator_profile) { create(:reviewer_profile, user: creator) }
    let(:pub_subject) { create(:reviewer_publication, user: creator) }
    let!(:feed_item) { FeedItem.create!(actor: creator, subject: pub_subject, verb: 'publish', published_at: Time.current) }

    def auth_headers(target_user)
      token = JWT.encode(
        { user_id: target_user.id, typ: 'access' },
        Rails.application.secret_key_base,
        'HS256'
      )
      { 'Authorization' => "Bearer #{token}" }
    end

    it 'returns http success and correct json schema for anonymous user' do
      get '/api/v1/feed'
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json).to have_key('data')
      expect(json).to have_key('meta')
      expect(json['meta']).to have_key('next_cursor')
      expect(json['meta']).to have_key('has_more')
    end

    it 'returns http success for authenticated user without follows' do
      get '/api/v1/feed?view=for_you&limit=15', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['data']).to be_an(Array)
    end

    it 'returns http success for authenticated user with follows' do
      SocialFollow.create!(
        follower: user,
        followable: creator_profile
      )

      get '/api/v1/feed?view=for_you&limit=15', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['data']).to be_an(Array)
      
      # verify engagement state
      item = json['data'].find { |i| i['id'] == "feed_#{feed_item.id}" }
      expect(item['engagement']['viewer_following']).to eq(true) if item
    end
  end
end
