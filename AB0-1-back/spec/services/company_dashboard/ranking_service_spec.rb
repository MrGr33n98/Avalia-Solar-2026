# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingService do
  let!(:company) { create(:company, rating_avg: 4.5, rating_count: 10, reviews_count: 5) }
  let!(:better_company) { create(:company, rating_avg: 4.8, rating_count: 15, reviews_count: 10) }
  let!(:worse_company) { create(:company, rating_avg: 4.0, rating_count: 5, reviews_count: 2) }
  let!(:category) { create(:category) }
  let(:snapshot_date) { Time.current.in_time_zone('America/Sao_Paulo').to_date }

  before do
    company.categories << category
    better_company.categories << category

    [[company, 10.0, 60], [better_company, 20.0, 80], [worse_company, 5.0, 40]].each do |ranked_company, score, trust_score|
      ActiveRecord::Base.connection.execute(
        "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{ranked_company.id}, #{score}, '{}', NOW(), NOW(), NOW())"
      )
      CompanyTrustScore.create!(company: ranked_company, score: trust_score, components: {}, computed_at: Time.current)
    end

    create_snapshot(company: better_company, position: 1, population: 3, score: 20.0)
    create_snapshot(company: company, position: 2, population: 3, score: 10.0)
    create_snapshot(company: worse_company, position: 3, population: 3, score: 5.0)
    create_snapshot(company: better_company, scope_type: 'category', scope_id: category.id, position: 1, population: 2, score: 20.0)
    create_snapshot(company: company, scope_type: 'category', scope_id: category.id, position: 2, population: 2, score: 10.0)
  end

  describe '#ranking_data' do
    it 'returns canonical ranking metrics from the daily snapshot' do
      result = described_class.new(company: company).ranking_data

      expect(result).to include(:current_position, :total_companies, :percentile, :category_rankings)
      expect(result[:status]).to eq('ready')
      expect(result[:current_position]).to eq(2)
      expect(result[:total_companies]).to eq(3)
      expect(result[:percentile]).to be_within(0.1).of(66.7)
    end

    it 'marks a missing official snapshot as processing instead of an operational error' do
      CompanyRankingSnapshot.delete_all

      result = described_class.new(company: company).ranking_data

      expect(result[:status]).to eq('processing')
      expect(result[:error]).to be_nil
      expect(result.dig(:quality, :flags)).to include('snapshot_processing')
    end

    it 'uses the current scored population for an ad hoc preview' do
      result = described_class.new(company: company, state: 'SP').ranking_data

      expect(result[:mode]).to eq('preview')
      expect(result[:score]).to eq(10.0)
      expect(result[:current_position]).to eq(2)
      expect(result[:transparency][:is_ad_hoc_preview]).to be(true)
    end

    it 'normalizes city accents, case and surrounding spaces' do
      [company, better_company, worse_company].each { |record| record.update!(city: 'Florianópolis') }

      result = described_class.new(company: company, state: 'SP', city: '  florianopolis ').ranking_data

      expect(result[:total_companies]).to eq(3)
      expect(result[:current_position]).to eq(2)
    end

    it 'does not publish an official position for a criterion preview with an available quadrant' do
      result = described_class.new(company: company, category_id: category.id, criterion_slug: 'quality').ranking_data

      expect(result[:mode]).to eq('preview')
      expect(result[:ranking_status]).to eq('not_applicable')
      expect(result[:quadrant_status]).to eq('ready')
      expect(result[:current_position]).to be_nil
      expect(result[:transparency][:position_semantics]).to eq('quadrant_preview_without_official_position')
    end

    it 'returns V2 insight fields with traceable metric evidence' do
      result = described_class.new(company: company).ranking_data

      expect(result[:insights]).to include(:strengths, :opportunities, :next_best_action)
      expect(result.dig(:insights, :next_best_action, :metric)).to include(:key, :value)
    end

    it 'returns category-specific rankings from category snapshots' do
      result = described_class.new(company: company).ranking_data
      category_rank = result[:category_rankings].find { |ranking| ranking[:category_id] == category.id }

      expect(category_rank).to include(:category_id, :category_name, :position, :total, :percentile)
      expect(category_rank[:position]).to eq(2)
      expect(category_rank[:total]).to eq(2)
    end

    it 'returns a 30-day trend only when a comparable daily point exists' do
      create_snapshot(company: company, position: 3, population: 3, score: 8.0, snapshot_date: snapshot_date - 31.days)

      result = described_class.new(company: company, history_days: 90).ranking_data

      expect(result.dig(:history_trend_30d, :position_change)).to eq(1)
      expect(result.dig(:history_trend_30d, :score_change)).to eq(2.0)
    end
  end

  private

  def create_snapshot(company:, position:, population:, score:, scope_type: 'global', scope_id: nil, snapshot_date: self.snapshot_date)
    CompanyRankingSnapshot.create!(
      company: company,
      scope_type: scope_type,
      scope_id: scope_id,
      definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
      score: score,
      rank_position: position,
      population_size: population,
      percentile: ((population - position + 1).to_f / population * 100).round(2),
      breakdown: { 'base_trust' => 60, 'recent_engagement' => score - 5 },
      quality_flags: [],
      snapshot_date: snapshot_date,
      data_through: snapshot_date.yesterday.end_of_day,
      computed_at: snapshot_date.end_of_day
    )
  end
end
