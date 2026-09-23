# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Organic ranking sponsorship invariant' do
  it 'does not expose sponsored placement as the organic Ranking Performance score' do
    company = create(:company, sponsored: true, rating_avg: 5.0, rating_count: 100)
    ActiveRecord::Base.connection.execute(<<~SQL.squish)
      INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at)
      VALUES (#{company.id}, 50, '{}', NOW(), NOW(), NOW())
    SQL

    result = CompanyDashboard::RankingService.new(company: company, state: company.state).ranking_data

    expect(company.calculate_sponsored_placement_score).to be > 50
    expect(result.dig(:ranking, :score)).to eq(50.0)
    expect(result.dig(:definition, :sponsored_included)).to be(false)
  end
end
