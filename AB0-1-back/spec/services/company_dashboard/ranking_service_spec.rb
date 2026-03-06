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
