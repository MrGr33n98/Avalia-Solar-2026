# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::UserAchievements', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) { create(:admin_user) }
  # Nome com 3 partes: User#display_name abreviaria para "Maria Souza".
  let(:user) { create(:user, role: 'review', name: 'Maria Helena Souza') }
  let(:badge) { create(:achievement_badge, points_xp: 50) }
  let!(:user_achievement) do
    create(:user_achievement,
           user: user,
           achievement_badge: badge,
           state: 'unlocked',
           unlocked_at: 1.day.ago,
           share_token: 'token_admin_test_123')
  end
  let!(:unlock_ledger) do
    create(:achievement_ledger, user: user, achievement_badge: badge, kind: 'unlocked', xp_delta: 50,
                                idempotency_key: "user:#{user.id}:badge:#{badge.slug}:unlock")
  end
  let(:valid_reason) { 'Fraude comprovada na avaliação da empresa parceira' }

  before do
    sign_in admin_user
  end

  describe 'GET /admin/user_achievements' do
    it 'renders the index page with the full user name' do
      get admin_user_achievements_path

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Maria Helena Souza')
      expect(response.body).to include(badge.name)
    end
  end

  describe 'GET /admin/user_achievements/:id' do
    it 'renders the audit history with reason and administrator' do
      create(:achievement_ledger, user: user, achievement_badge: badge, kind: 'manual_revoke', xp_delta: -50,
                                  admin_user: admin_user, reason: 'Auditoria interna de conformidade')

      get admin_user_achievement_path(user_achievement)

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Maria Helena Souza')
      expect(response.body).to include('Auditoria interna de conformidade')
      expect(response.body).to include(admin_user.email)
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
    it 'renders the ledger audit page with user, reason and administrator' do
      create(:achievement_ledger, user: user, achievement_badge: badge, kind: 'manual_grant', xp_delta: 0,
                                  admin_user: admin_user, reason: 'Concessão homologada pela gerência')

      get admin_achievement_ledgers_path

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Maria Helena Souza')
      expect(response.body).to include('Concessão homologada pela gerência')
      expect(response.body).to include(admin_user.email)
    end

    it 'supports filtering by reason' do
      get admin_achievement_ledgers_path, params: { q: { reason_cont: 'Transição' } }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST /admin/user_achievements/:id/revoke' do
    context 'with valid justification (>= 20 characters)' do
      it 'revokes the achievement and creates an auditable ledger record' do
        expect do
          post revoke_admin_user_achievement_path(user_achievement), params: { justification: valid_reason }
        end.to change(AchievementLedger, :count).by(1)

        expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
        expect(user_achievement.reload).to be_revoked
        expect(user_achievement.revoked_at).to be_present

        ledger = AchievementLedger.order(:id).last
        expect(ledger.kind).to eq('manual_revoke')
        expect(ledger.xp_delta).to eq(-50)
        expect(ledger.reason).to eq(valid_reason)
        expect(ledger.admin_user_id).to eq(admin_user.id)
        expect(user.reload.total_achievement_xp).to eq(0)
      end

      it 'is idempotent when the same request is repeated' do
        post revoke_admin_user_achievement_path(user_achievement), params: { justification: valid_reason }

        expect do
          post revoke_admin_user_achievement_path(user_achievement), params: { justification: valid_reason }
        end.not_to change(AchievementLedger, :count)

        expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
        expect(user.reload.total_achievement_xp).to eq(0)
      end
    end

    context 'with short justification (< 20 characters)' do
      it 'rejects revocation and keeps achievement unlocked' do
        expect do
          post revoke_admin_user_achievement_path(user_achievement), params: { justification: 'curto' }
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
      create(:achievement_ledger, user: user, achievement_badge: badge, kind: 'revoked', xp_delta: -50)
    end

    let(:reinstate_reason) { 'Recurso do avaliador aceito após nova análise' }

    it 'reinstates the revoked achievement and creates a ledger record' do
      expect do
        post reinstate_admin_user_achievement_path(user_achievement), params: { justification: reinstate_reason }
      end.to change(AchievementLedger, :count).by(1)

      expect(response).to redirect_to(admin_user_achievement_path(user_achievement))
      expect(user_achievement.reload).to be_unlocked
      expect(user_achievement.revoked_at).to be_nil

      ledger = AchievementLedger.order(:id).last
      expect(ledger.kind).to eq('reinstated')
      expect(ledger.xp_delta).to eq(50)
      expect(ledger.reason).to eq(reinstate_reason)
      expect(ledger.admin_user_id).to eq(admin_user.id)
    end

    it 'requires a justification' do
      expect do
        post reinstate_admin_user_achievement_path(user_achievement)
      end.not_to change(AchievementLedger, :count)

      expect(user_achievement.reload).to be_revoked
      expect(flash[:error]).to include('mínimo 20 caracteres')
    end

    it 'does not duplicate XP when repeated' do
      2.times do
        post reinstate_admin_user_achievement_path(user_achievement), params: { justification: reinstate_reason }
      end

      expect(AchievementLedger.where(kind: 'reinstated').count).to eq(1)
      expect(user.reload.total_achievement_xp).to eq(50)
    end
  end

  describe 'POST /admin/user_achievements/manual_grant' do
    let(:new_badge) { create(:achievement_badge, slug: 'badge_grant_99', points_xp: 75) }
    let(:grant_params) do
      { user_id: user.id, badge_id: new_badge.id, justification: 'Concessão especial homologada pela gerência técnica' }
    end

    context 'with valid user, badge and justification' do
      it 'grants achievement and records in ledger' do
        expect do
          post manual_grant_admin_user_achievements_path, params: grant_params
        end.to change(AchievementLedger, :count).by(1)

        expect(response).to redirect_to(admin_user_achievements_path)
        ua = UserAchievement.find_by(user: user, achievement_badge: new_badge)
        expect(ua).to be_present
        expect(ua).to be_unlocked

        ledger = AchievementLedger.order(:id).last
        expect(ledger.kind).to eq('manual_grant')
        expect(ledger.xp_delta).to eq(75)
        expect(ledger.reason).to include('Concessão especial')
        expect(ledger.admin_user_id).to eq(admin_user.id)
      end

      it 'is idempotent and never duplicates XP' do
        2.times { post manual_grant_admin_user_achievements_path, params: grant_params }

        expect(UserAchievement.where(user: user, achievement_badge: new_badge).count).to eq(1)
        expect(AchievementLedger.where(achievement_badge: new_badge, kind: 'manual_grant').count).to eq(1)
        expect(user.reload.total_achievement_xp).to eq(50 + 75)
      end
    end

    context 'with an invalid badge' do
      it 'does not create records' do
        expect do
          post manual_grant_admin_user_achievements_path, params: grant_params.merge(badge_id: 0)
        end.not_to change(AchievementLedger, :count)

        expect(flash[:error]).to include('inválida')
      end
    end
  end

  describe 'physical deletion' do
    it 'is not authorized for achievements, ledger or catalog' do
      expect(UserAchievementPolicy.new(admin_user, user_achievement).destroy?).to be(false)
      expect(AchievementLedgerPolicy.new(admin_user, unlock_ledger).destroy?).to be(false)
      expect(AchievementBadgePolicy.new(admin_user, badge).destroy?).to be(false)
    end

    it 'does not expose destroy routes' do
      routes = Rails.application.routes.routes.map { |r| [r.verb, r.path.spec.to_s] }

      expect(routes).not_to include(['DELETE', '/admin/user_achievements/:id(.:format)'])
      expect(routes).not_to include(['DELETE', '/admin/achievement_ledgers/:id(.:format)'])
      expect(routes).not_to include(['DELETE', '/admin/achievement_badges/:id(.:format)'])
    end
  end
end
