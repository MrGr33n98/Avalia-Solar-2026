# frozen_string_literal: true

require 'rails_helper'

RSpec.describe IntentScore, type: :model do
  let(:company) { create(:company) }

  describe 'G2 Buying Stage and Activity Level classification' do
    it 'classifies as awareness when there are only casual visits and micro-interactions' do
      score = described_class.new(
        company: company,
        anonymous_id: 'anon-aware',
        total_score: 25,
        total_signals_count: 2,
        hot_signals_count: 0,
        score_breakdown: {
          'signal_counts' => {
            'by_type' => { 'profile_view' => 1, 'hover_intent' => 1 },
            'by_category' => { 'research_intent' => 1, 'micro_interaction' => 1 }
          }
        }
      )

      expect(score.buying_stage).to eq('awareness')
      expect(score.activity_level).to eq('low')
    end

    it 'does NOT inflate hovers into decision stage even with high total score' do
      score = described_class.new(
        company: company,
        anonymous_id: 'anon-hover',
        total_score: 65,
        total_signals_count: 15,
        hot_signals_count: 0,
        score_breakdown: {
          'signal_counts' => {
            'by_type' => { 'hover_intent' => 10, 'scroll_pause' => 5 },
            'by_category' => { 'micro_interaction' => 15 }
          }
        }
      )

      expect(score.buying_stage).to eq('consideration')
      expect(score.activity_level).to eq('high')
      expect(score.buying_stage).not_to eq('decision')
    end

    it 'promotes to consideration when comparison or in-depth reviews occur' do
      score = described_class.new(
        company: company,
        anonymous_id: 'anon-consider',
        total_score: 48,
        total_signals_count: 4,
        hot_signals_count: 1,
        score_breakdown: {
          'signal_counts' => {
            'by_type' => { 'comparison_view' => 1, 'review_deep_read' => 1, 'profile_view' => 2 },
            'by_category' => { 'research_intent' => 4 }
          }
        }
      )

      expect(score.buying_stage).to eq('consideration')
      expect(score.activity_level).to eq('medium')
      expect(score.direct_pageviews).to eq(2)
      expect(score.competitive_pageviews).to eq(1)
    end

    it 'promotes to decision when transactional or contact intent signals occur' do
      score = described_class.new(
        company: company,
        anonymous_id: 'anon-decision',
        total_score: 78,
        total_signals_count: 6,
        hot_signals_count: 3,
        score_breakdown: {
          'signal_counts' => {
            'by_type' => { 'pricing_interaction' => 1, 'whatsapp_click' => 1, 'profile_view' => 1 },
            'by_category' => { 'financial_intent' => 1, 'contact_intent' => 1, 'research_intent' => 1 }
          }
        }
      )

      expect(score.buying_stage).to eq('decision')
      expect(score.activity_level).to eq('high')
    end
  end
end
