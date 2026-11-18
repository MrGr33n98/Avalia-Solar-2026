# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Achievements::Verifications', type: :request do
  let(:user) { create(:user, name: 'Felipe Santos Silva', role: 'review') }
  let(:badge) do
    create(:achievement_badge,
           slug: 'review_approved_1',
           name: '1ª Avaliação Aprovada',
           category: 'review',
           tier: 'bronze',
           threshold: 1,
           points_xp: 50,
           action_enum: 'write_review',
           description: 'Escreva e aprove sua 1ª avaliação na plataforma',
           criteria_description: '1 avaliação aprovada',
           position: 1,
           active: true)
  end

  let!(:user_achievement) do
    create(:user_achievement,
           user: user,
           achievement_badge: badge,
           state: 'unlocked',
           unlocked_at: 1.day.ago,
           share_token: 'valid_token_abc_123')
  end

  describe 'GET /api/v1/achievements/verify/:token' do
    context 'when token is valid and achievement is unlocked' do
      it 'returns 200 with badge details and masked recipient name (LGPD compliant)' do
        get "/api/v1/achievements/verify/#{user_achievement.share_token}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['status']).to eq('valid')
        expect(json['badge']['slug']).to eq('review_approved_1')
        expect(json['badge']['name']).to eq('1ª Avaliação Aprovada')
        expect(json['badge']['points']).to eq(50)
        expect(json['badge']['icon_url']).to eq('/assets/achievements/cards/review_approved_1.svg')

        # Recipient masked for LGPD
        expect(json['recipient']['display_name']).to eq('Felipe S.')
        expect(json['recipient']['member_since']).to be_present

        # Verification details
        expect(json['verification']['token']).to eq(user_achievement.share_token)
        expect(json['verification']['unlocked_at']).to be_present
        expect(json['verification']['verified_at']).to be_present
        expect(json['verification']['authenticity_url']).to include(user_achievement.share_token)
      end
    end

    context 'when achievement has been revoked' do
      before do
        user_achievement.update!(state: 'revoked', revoked_at: Time.current)
      end

      it 'returns 410 Gone with revocation message' do
        get "/api/v1/achievements/verify/#{user_achievement.share_token}"

        expect(response).to have_http_status(:gone)
        json = JSON.parse(response.body)

        expect(json['status']).to eq('revoked')
        expect(json['error']).to include('revogada')
        expect(json['revoked_at']).to be_present
      end
    end

    context 'when token is invalid or does not exist' do
      it 'returns 404 Not Found' do
        get '/api/v1/achievements/verify/non_existent_token_999'

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)

        expect(json['status']).to eq('not_found')
        expect(json['error']).to include('não encontrado')
      end
    end
  end
end
