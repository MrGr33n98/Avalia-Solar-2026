require 'rails_helper'

RSpec.describe 'Api::V1::Reviewer::TreeSettings', type: :request do
  let(:user) { create(:user) }
  let(:reviewer_profile) { create(:reviewer_profile, user: user) }
  let(:headers) { auth_headers(user) }

  before do
    reviewer_profile
  end

  describe 'GET /api/v1/reviewer/tree/settings' do
    context 'when user has tree settings' do
      let!(:settings) { create(:creator_tree_setting, reviewer_profile: reviewer_profile, theme_key: 'dark', appearance: { buttonStyle: { variant: 'outline' } }) }

      it 'returns the settings' do
        get '/api/v1/reviewer/tree/settings', headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['theme_key']).to eq('dark')
        expect(json['appearance']['buttonStyle']['variant']).to eq('outline')
      end
    end

    context 'when user does not have tree settings' do
      it 'builds and returns default settings' do
        get '/api/v1/reviewer/tree/settings', headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['theme_key']).to eq('solar')
      end
    end

    context 'unauthorized' do
      it 'returns unauthorized' do
        get '/api/v1/reviewer/tree/settings'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /api/v1/reviewer/tree/settings' do
    let(:valid_params) do
      {
        settings: {
          theme_key: 'glass',
          appearance: { buttonStyle: { variant: 'solid' } }
        }
      }
    end

    it 'updates existing settings' do
      create(:creator_tree_setting, reviewer_profile: reviewer_profile)
      patch '/api/v1/reviewer/tree/settings', params: valid_params, headers: headers
      expect(response).to have_http_status(:ok)
      
      reviewer_profile.reload
      expect(reviewer_profile.creator_tree_setting.theme_key).to eq('glass')
      expect(reviewer_profile.creator_tree_setting.appearance['buttonStyle']['variant']).to eq('solid')
    end

    it 'creates new settings if they do not exist' do
      expect {
        patch '/api/v1/reviewer/tree/settings', params: valid_params, headers: headers
      }.to change(CreatorTreeSetting, :count).by(1)
      
      expect(response).to have_http_status(:ok)
      reviewer_profile.reload
      expect(reviewer_profile.creator_tree_setting.theme_key).to eq('glass')
    end
  end
end
