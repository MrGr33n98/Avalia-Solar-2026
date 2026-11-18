# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gamification::ReadModelService do
  let(:user) { create(:user, role: 'review') }
  let!(:badge1) do
    create(:achievement_badge,
           slug: 'review_approved_1',
           name: '1ª Avaliação Aprovada',
           category: 'review',
           tier: 'bronze',
           threshold: 1,
           points_xp: 50,
           action_enum: 'write_review',
           position: 1,
           active: true)
  end
  let!(:badge2) do
    create(:achievement_badge,
           slug: 'review_approved_3',
           name: '3ª Avaliação Aprovada',
           category: 'review',
           tier: 'silver',
           threshold: 3,
           points_xp: 100,
           action_enum: 'write_review',
           position: 2,
           active: true)
  end

  subject(:read_model) { described_class.new(user: user, base_url: 'https://avaliasolar.com.br').call }

  describe '#call' do
    context 'quando o usuário não desbloqueou nenhuma conquista' do
      it 'retorna resumo com zero desbloqueios e estado bloqueado' do
        expect(read_model[:schema_version]).to eq('2026-11-v1')
        expect(read_model[:summary][:unlocked_count]).to eq(0)
        expect(read_model[:summary][:total_count]).to eq(2)
        expect(read_model[:summary][:xp_total]).to eq(0)
        expect(read_model[:summary][:completion_percentage]).to eq(0)
        expect(read_model[:summary][:next_suggested][:id]).to eq('review_approved_1')

        badge_item = read_model[:achievements].find { |a| a[:id] == 'review_approved_1' }
        expect(badge_item[:state]).to eq('locked')
        expect(badge_item[:unlocked]).to be(false)
        expect(badge_item[:progress]).to eq(0)
        expect(badge_item[:share]).to be_nil
      end
    end

    context 'quando o usuário tem progresso parcial' do
      before do
        create(:review, user: user, status: :approved)
      end

      it 'calcula progresso para selos superiores' do
        badge2_item = read_model[:achievements].find { |a| a[:id] == 'review_approved_3' }
        expect(badge2_item[:progress]).to eq(1)
        expect(badge2_item[:state]).to eq('in_progress')
      end
    end

    context 'quando o usuário desbloqueou conquistas' do
      let!(:ua) do
        create(:user_achievement,
               user: user,
               achievement_badge: badge1,
               state: 'unlocked',
               unlocked_at: 1.day.ago)
      end
      let!(:ledger) do
        create(:achievement_ledger,
               user: user,
               achievement_badge: badge1,
               kind: 'unlocked',
               xp_delta: 50,
               idempotency_key: "unlock:#{user.id}:#{badge1.id}")
      end

      it 'retorna estado desbloqueado com URL de compartilhamento e XP total' do
        expect(read_model[:summary][:unlocked_count]).to eq(1)
        expect(read_model[:summary][:xp_total]).to eq(50)
        expect(read_model[:summary][:completion_percentage]).to eq(50)
        expect(read_model[:summary][:next_suggested][:id]).to eq('review_approved_3')

        badge_item = read_model[:achievements].find { |a| a[:id] == 'review_approved_1' }
        expect(badge_item[:state]).to eq('unlocked')
        expect(badge_item[:unlocked]).to be(true)
        expect(badge_item[:xp]).to eq(50)
        expect(badge_item[:progress]).to eq(1)
        expect(badge_item[:share][:verify_url]).to eq("https://avaliasolar.com.br/conquistas/verificar/#{ua.share_token}")
        expect(badge_item[:share][:token]).to eq(ua.share_token)
      end
    end

    it 'inclui itens de FAQ' do
      expect(read_model[:faq]).to be_an(Array)
      expect(read_model[:faq].first).to include(:question, :answer)
    end
  end
end
