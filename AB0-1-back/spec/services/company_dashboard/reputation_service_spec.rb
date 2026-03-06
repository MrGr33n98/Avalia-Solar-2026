# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::ReputationService do
  let(:company) { create(:company) }
  let!(:review1) { create(:review, company: company, status: :approved, rating: 5) }
  let!(:review2) { create(:review, company: company, status: :approved, rating: 4) }
  let!(:review3) { create(:review, company: company, status: :pending, rating: 3) }

  describe '#reputation_data' do
    it 'returns reputation metrics' do
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result).to include(:total_reviews, :avg_rating, :trust_score, :trust_components)
    end

    it 'counts only approved reviews' do
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result[:total_reviews]).to eq(2)
    end

    it 'calculates average rating correctly' do
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result[:avg_rating]).to eq(4.5)
    end

    it 'returns trust score from trust table' do
      create(:company_trust_score, company: company, score: 85.5)
      
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result[:trust_score]).to eq(85.5)
    end

    it 'returns zero trust score when no record exists' do
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result[:trust_score]).to eq(0.0)
    end

    it 'parses trust components JSON' do
      create(:company_trust_score, 
        company: company, 
        score: 85.5,
        components: '{"reviews": 90, "response_time": 80}'
      )
      
      service = described_class.new(company: company)
      result = service.reputation_data

      expect(result[:trust_components]).to eq({ 'reviews' => 90, 'response_time' => 80 })
    end
  end
end
