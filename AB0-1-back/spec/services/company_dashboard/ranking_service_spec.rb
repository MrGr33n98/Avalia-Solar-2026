# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingService do
  let!(:company) { create(:company, rating_avg: 4.5, rating_count: 10) }
  let!(:better_company) { create(:company, rating_avg: 4.8, rating_count: 15) }
  let!(:worse_company) { create(:company, rating_avg: 4.0, rating_count: 5) }
  let!(:category) { create(:category) }

  before do
    company.categories << category
    better_company.categories << category

    [ [company, 10.0], [better_company, 20.0], [worse_company, 5.0] ].each do |ranked_company, score|
      ActiveRecord::Base.connection.execute("INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{ranked_company.id}, #{score}, '{}', NOW(), NOW(), NOW())")
    end
  end

  describe '#ranking_data' do
    it 'returns ranking metrics' do
      service = described_class.new(company: company)
      result = service.ranking_data

      expect(result).to include(:current_position, :total_companies, :percentile, :category_rankings)
    end

    it 'calculates correct position' do
      service = described_class.new(company: company)
      result = service.ranking_data

      # Company should be 2nd (after better_company)
      expect(result[:current_position]).to eq(2)
    end

    it 'counts total active companies' do
      service = described_class.new(company: company)
      result = service.ranking_data

      expect(result[:total_companies]).to eq(3)
    end

    it 'calculates percentile correctly' do
      service = described_class.new(company: company)
      result = service.ranking_data

      # Position 2 out of 3 = 66.7%
      expect(result[:percentile]).to be_within(0.1).of(66.7)
    end

    it 'marks missing official snapshot as unavailable' do
      result = described_class.new(company: company).ranking_data

      expect(result[:status]).to eq('unavailable')
      expect(result[:error][:code]).to eq('RANKING_SNAPSHOT_UNAVAILABLE')
    end

    it 'uses canonical score for ad hoc ranking' do
      result = described_class.new(company: company, state: 'SC').ranking_data

      expect(result[:score]).to eq(10.0)
      expect(result[:transparency][:is_ad_hoc_preview]).to be(true)
    end

    it 'does not publish official position for criterion preview' do
      result = described_class.new(company: company, criterion_slug: 'quality').ranking_data

      expect(result[:current_position]).to be_nil
      expect(result[:transparency][:position_semantics]).to eq('quadrant_preview_without_official_position')
    end

    it 'returns V2 insight fields' do
      result = described_class.new(company: company).ranking_data

      expect(result).to include(:leaders, :neighbors, :insights)
      expect(result[:insights]).to include(:strengths, :opportunities, :next_best_action)
    end

    it 'returns category-specific rankings' do
      service = described_class.new(company: company)
      result = service.ranking_data

      expect(result[:category_rankings]).to be_an(Array)
      expect(result[:category_rankings].first).to include(
        :category_id, :category_name, :position, :total, :percentile
      )
    end

    it 'ranks within category correctly' do
      service = described_class.new(company: company)
      result = service.ranking_data

      category_rank = result[:category_rankings].find { |r| r[:category_id] == category.id }
      expect(category_rank[:position]).to eq(2) # 2nd in category
      expect(category_rank[:total]).to eq(2) # 2 companies in category
    end
  end
end
