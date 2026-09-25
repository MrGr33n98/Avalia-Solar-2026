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

    it 'counts the scored population with qualified distinct company ids' do
      service = described_class.new(company: company)

      expect(service.send(:total_companies)).to eq(3)
    end

    it 'supports category ranking without ambiguous ids or invalid distinct ordering' do
      result = described_class.new(company: company, category_id: category.id).ranking_data

      expect(result[:status]).to eq('ready')
      expect(result[:total_companies]).to eq(2)
      expect(result[:current_position]).to eq(2)
    end

    it 'marks a missing official snapshot as processing instead of an operational error' do
      CompanyRankingSnapshot.delete_all

      result = described_class.new(company: company).ranking_data

      expect(result[:status]).to eq('processing')
      expect(result[:error]).to be_nil
      expect(result.dig(:quality, :flags)).to include('snapshot_processing')
    end

    it 'detects an incompatible ranking schema explicitly' do
      allow(Company).to receive(:column_names).and_return(Company.column_names - ['cta_whatsapp_enabled'])

      expect { described_class.new(company: company).ranking_data }
        .to raise_error(CompanyDashboard::RankingService::SchemaMismatch, /cta_whatsapp_enabled/)
    end

    it 'uses the current scored population for an ad hoc preview' do
      result = described_class.new(company: company, state: 'SP').ranking_data

      expect(result[:status]).to eq('preview')
      expect(result[:mode]).to eq('preview')
      expect(result[:score]).to eq(10.0)
      expect(result[:current_position]).to eq(2)
      expect(result[:transparency][:is_ad_hoc_preview]).to be(true)
    end

    it 'keeps the official snapshot distinct from a state comparison' do
      [company, better_company, worse_company].each do |record|
        record.update!(state: 'SC', city: 'Florianópolis')
      end

      result = described_class.new(company: company, state: 'SC').ranking_data

      expect(result[:mode]).to eq('preview')
      expect(result[:official_scope]).to eq(type: 'global', category_id: nil)
      expect(result[:comparison_scope]).to include(active: true, state: 'SC')
      expect(result.dig(:ranking, :position)).to eq(2)
      expect(result.dig(:official_ranking, :position)).to eq(2)
      expect(result.dig(:history, :scope)).to eq('official')
    end

    it 'normalizes city accents, case and surrounding spaces' do
      [company, better_company, worse_company].each do |record|
        record.update!(state: 'SC', city: 'Florianópolis')
      end

      result = described_class.new(company: company, state: 'SC', city: '  florianopolis ').ranking_data

      expect(result[:total_companies]).to eq(3)
      expect(result[:current_position]).to eq(2)
    end

    it 'applies state, city and sector filters to the population scope' do
      company.update!(project_types: ['Residenciais'])
      better_company.update!(project_types: ['Residenciais'])
      worse_company.update!(project_types: ['Comerciais'])

      result = described_class.new(
        company: company,
        state: 'sp',
        city: 'sao paulo',
        sector: 'Residenciais'
      ).ranking_data

      expect(result[:mode]).to eq('preview')
      expect(result[:total_companies]).to eq(2)
      expect(result[:current_position]).to eq(2)
    end

    it 'preserves the reviews quadrant mode' do
      result = described_class.new(company: company, quadrant_mode: 'reviews').ranking_data

      expect(result.dig(:quadrant_meta, :mode)).to eq('reviews')
      expect(result[:quadrant_status]).to eq('insufficient_sample')
      expect(result.dig(:quadrant, :status)).to eq('insufficient_sample')
    end

    it 'supports the bounded history windows' do
      [30, 90, 365].each do |history_days|
        result = described_class.new(company: company, history_days: history_days).ranking_data

        expect(result[:status]).to eq('ready')
      end
    end

    it 'marks an old snapshot as stale' do
      CompanyRankingSnapshot.where(company: company, scope_type: 'global').update_all(computed_at: 2.days.ago)

      result = described_class.new(company: company).ranking_data

      expect(result[:status]).to eq('stale')
      expect(result.dig(:quality, :flags)).to include('snapshot_stale')
    end

    it 'marks an empty filtered population as empty' do
      result = described_class.new(company: company, state: 'RJ').ranking_data

      expect(result[:status]).to eq('empty')
      expect(result[:total_companies]).to eq(0)
      expect(result.dig(:quality, :flags)).to include('population_empty')
    end

    it 'does not publish an official position for a criterion preview with an available quadrant' do
      result = described_class.new(company: company, category_id: category.id, criterion_slug: 'quality').ranking_data

      expect(result[:mode]).to eq('preview')
      expect(result[:ranking_status]).to eq('not_applicable')
      expect(result[:quadrant_status]).to eq('insufficient_sample')
      expect(result[:current_position]).to be_nil
      expect(result[:transparency][:position_semantics]).to eq('quadrant_preview_without_official_position')
    end

    it 'returns structured insights with traceable metric evidence' do
      7.times do |index|
        competitor = create(:company)
        ActiveRecord::Base.connection.execute(
          "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{competitor.id}, #{index + 1}, '{}', NOW(), NOW(), NOW())"
        )
        CompanyTrustScore.create!(company: competitor, score: 50, components: {}, computed_at: Time.current)
      end

      result = described_class.new(company: company).ranking_data

      expect(result[:insights]).to include(:strengths, :opportunities, :next_best_action)
      expect(result.dig(:benchmarks, :status)).to eq('ready')
      expect(result.dig(:insights, :next_best_action)).to include(:code, :title, :description, :metric, :evidence)
    end

    it 'includes the current eligible company and real adjacent neighbors in the positioning map' do
      16.times do |index|
        competitor = create(:company, reviews_count: index + 1, leads_count: index + 1, profile_views_count: (index + 1) * 10, cta_clicks_count: index + 1)
        ActiveRecord::Base.connection.execute(
          "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{competitor.id}, #{100 - index}, '{}', NOW(), NOW(), NOW())"
        )
        CompanyTrustScore.create!(company: competitor, score: 50, components: {}, computed_at: Time.current)
      end
      ActiveRecord::Base.connection.execute("UPDATE company_ranking_score SET score = 1 WHERE company_id = #{company.id}")

      result = described_class.new(company: company).ranking_data
      point_ids = result.dig(:quadrant, :points).map { |point| point[:id] }
      neighbor_ids = result[:neighbors].map { |point| point[:id] }

      expect(point_ids).to include(company.id)
      expect(neighbor_ids).not_to include(company.id)
      expect(neighbor_ids.length).to be <= 10
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

    it 'identifies a short official series as history in formation' do
      result = described_class.new(company: company).ranking_data

      expect(result.dig(:history, :status)).to eq('forming')
      expect(result.dig(:history, :scope)).to eq('official')
      expect(result.dig(:history, :minimum_snapshots)).to eq(7)
    end

    it 'exposes score drivers and real rank positions for nearby companies' do
      8.times do |index|
        competitor = create(:company, leads_count: index + 1, profile_views_count: (index + 1) * 10)
        ActiveRecord::Base.connection.execute(
          "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{competitor.id}, #{index + 2}, '{}', NOW(), NOW(), NOW())"
        )
        CompanyTrustScore.create!(company: competitor, score: index + 2, components: {}, computed_at: Time.current)
      end
      result = described_class.new(company: company, state: company.state).ranking_data
      current_point = result.dig(:quadrant, :points).find { |point| point[:is_current_company] }

      expect(result[:score_drivers]).to include(:status, :source, :items)
      expect(current_point).to include(:ranking_position, :ranking_score, :score_distance)
      expect(current_point[:score_distance]).to eq(0.0)
    end

    it 'supports positioning-v2 with enriched distribution and v2 methodology metadata' do
      8.times do |index|
        competitor = create(:company, leads_count: index + 1, profile_views_count: (index + 1) * 10)
        ActiveRecord::Base.connection.execute(
          "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{competitor.id}, #{index + 2}, '{\"recent_engagement\": #{index * 10}}', NOW(), NOW(), NOW())"
        )
        CompanyTrustScore.create!(company: competitor, score: index + 2, components: {}, computed_at: Time.current)
      end
      result = described_class.new(company: company, state: company.state, positioning_version: 'positioning-v2').ranking_data

      expect(result.dig(:quadrant, :methodology, :version)).to eq('positioning-v2')
      expect(result.dig(:quadrant, :meta, :methodology_version)).to eq('positioning-v2')
      expect(result.dig(:quadrant, :distribution)).to include(:p50_y, :p90_y, :floor_ratio_y)
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
