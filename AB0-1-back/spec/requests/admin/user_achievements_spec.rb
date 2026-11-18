# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::UserAchievements', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) { create(:admin_user) }
  let(:user) { create(:user, role: 'review') }
  let(:badge) { create(:achievement_badge, points_xp: 50) }
  let!(:user_achievement) do
    create(:user_achievement,
           user: user,
           achievement_badge: badge,
           state: 'unlocked',
           unlocked_at: 1.day.ago,
           share_token: 'token_admin_test_123')
  end

  before do
    sign_in admin_user
  end

  describe 'GET /admin/user_achievements' do
    it 'renders the index page successfully' do
      get admin_user_achievements_path

      expect(response).to have_http_status(:success)
      expect(response.body).to include(user.name)
      expect(response.body).to include(badge.name)
    end
  end

  describe 'GET /admin/achievement_badges' do
    it 'renders the catalog page successfully' do
      get admin_achievement_badges_path

      expect(response).to have_http_status(:success)
      expect(response.body).to include(badge.name)
    end
  end

  describe 'GET /admin/achievement_ledgers' do
    it 'renders the ledger audit page successfully' do
      get admin_achievement_ledgers_path

      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST /admin/user_achievements/:id/revoke' do
    context 'with valid justification (>= 20 characters)' do
      it 'revokes the achievement and creates an audit ledger record' do
        expect do
          post revoke_admin_user_achievement_path(user_achievement),
               params: { justification: 'Fraude comprovada na avaliação da empresa parceira' }
        end.to change(AchievementLedger, :count).by(1)

        expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
        expect(user_achievement.reload).to be_revoked
        expect(user_achievement.revoked_at).to be_present

        ledger = AchievementLedger.last
        expect(ledger.kind).to eq('manual_revoke')
        expect(ledger.points_delta).to eq(-50)
        expect(ledger.metadata['reason']).to include('Fraude comprovada')
        expect(ledger.metadata['admin_user_id']).to eq(admin_user.id)
      end
    end

    context 'with short justification (< 20 characters)' do
      it 'rejects revocation and keeps achievement unlocked' do
        expect do
          post revoke_admin_user_achievement_path(user_achievement),
               params: { justification: 'curto' }
        end.not_to change(AchievementLedger, :count)

        expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
        expect(user_achievement.reload).to be_unlocked
        expect(flash[:error]).to include('mínimo 20 caracteres')
      end
    end
  end

  describe 'POST /admin/user_achievements/:id/reinstate' do
    before do
      user_achievement.update!(state: 'revoked', revoked_at: Time.current)
    end

    it 'reinstates the revoked achievement and creates a ledger record' do
      expect do
        post reinstate_admin_user_achievement_path(user_achievement)
      end.to change(AchievementLedger, :count).by(1)

      expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
      expect(user_achievement.reload).to be_unlocked
      expect(user_achievement.revoked_at).to be_nil

      ledger = AchievementLedger.last
      expect(ledger.kind).to eq('reinstated')
      expect(ledger.points_delta).to eq(50)
    end
  end

  describe 'POST /admin/user_achievements/manual_grant' do
    let(:new_badge) { create(:achievement_badge, slug: 'badge_grant_99', points_xp: 75) }

    context 'with valid user, badge and justification' do
      it 'grants achievement and records in ledger' do
        expect do
          post manual_grant_admin_user_achievements_path,
               params: {
                 user_id: user.id,
                 badge_id: new_badge.id,
                 justification: 'Concessão especial homologada pela gerência técnica'
               }
        end.to change(AchievementLedger, :count).by(1)

        expect(response).to redirect_to(admin_user_achievements_path)
        ua = UserAchievement.find_by(user: user, achievement_badge: new_badge)
        expect(ua).to be_present
        expect(ua).to be_unlocked

        ledger = AchievementLedger.last
        expect(ledger.kind).to eq('manual_grant')
        expect(ledger.points_delta).to eq(75)
        expect(ledger.metadata['reason']).to include('Concessão especial')
      end
    end
  end
end
