# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gamification::AdminAchievementService, type: :service do
  subject(:service) { described_class.new(admin_user: admin_user) }

  let(:admin_user) { create(:admin_user) }
  let(:user) { create(:user, role: 'review', name: 'Carlos Eduardo Silva') }
  let(:badge) { create(:achievement_badge, points_xp: 75) }
  let(:reason) { 'Operação administrativa auditada pela equipe de confiança' }

  describe '#grant' do
    it 'grants a new badge, writes an auditable ledger row, and is idempotent on repeat' do
      first = service.grant(user: user, badge: badge, reason: reason)
      second = service.grant(user: user, badge: badge, reason: reason)

      expect(first).to be_applied
      expect(second).to be_noop
      expect(UserAchievement.where(user: user, achievement_badge: badge).count).to eq(1)
      expect(AchievementLedger.where(user: user, achievement_badge: badge).count).to eq(1)

      ledger = first.ledger
      expect(ledger.kind).to eq('manual_grant')
      expect(ledger.xp_delta).to eq(75)
      expect(ledger.admin_user_id).to eq(admin_user.id)
      expect(ledger.reason).to eq(reason)
      expect(user.reload.total_achievement_xp).to eq(75)
    end

    it 'rejects reasons shorter than 20 characters without mutating state' do
      result = service.grant(user: user, badge: badge, reason: 'motivo curto')

      expect(result).to be_invalid
      expect(result.error).to include('20 caracteres')
      expect(UserAchievement.count).to eq(0)
      expect(AchievementLedger.count).to eq(0)
    end
  end

  describe '#revoke and #reinstate' do
    it 'maintains exact XP accounting across grant -> revoke -> reinstate -> revoke cycles without duplicates' do
      grant_res = service.grant(user: user, badge: badge, reason: reason)
      ua = grant_res.user_achievement
      expect(user.total_achievement_xp).to eq(75)

      revoke_one = service.revoke(ua, reason: 'Evidência inconsistente identificada na auditoria')
      revoke_dup = service.revoke(ua, reason: 'Evidência inconsistente identificada na auditoria')

      expect(revoke_one).to be_applied
      expect(revoke_one.ledger.xp_delta).to eq(-75)
      expect(revoke_one.ledger.admin_user_id).to eq(admin_user.id)
      expect(revoke_dup).to be_noop
      expect(ua.reload).to be_revoked
      expect(user.total_achievement_xp).to eq(0)

      reinstate_one = service.reinstate(ua, reason: 'Documentação complementar comprovada pelo avaliador')
      reinstate_dup = service.reinstate(ua, reason: 'Documentação complementar comprovada pelo avaliador')

      expect(reinstate_one).to be_applied
      expect(reinstate_one.ledger.xp_delta).to eq(75)
      expect(reinstate_dup).to be_noop
      expect(ua.reload).to be_unlocked
      expect(user.total_achievement_xp).to eq(75)

      revoke_two = service.revoke(ua, reason: 'Segunda revogação formal após reanálise técnica')
      expect(revoke_two).to be_applied
      expect(revoke_two.ledger.xp_delta).to eq(-75)
      expect(user.total_achievement_xp).to eq(0)

      expect(AchievementLedger.where(user: user, achievement_badge: badge).count).to eq(4)
    end
  end
end
