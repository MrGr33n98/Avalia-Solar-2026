# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingSnapshotWriter do
  let!(:higher_trust_company) { create(:company, reviews_count: 2) }
  let!(:lower_trust_company) { create(:company, reviews_count: 20) }
  let(:now) { Time.zone.parse('2026-09-21 10:00:00') }

  before do
    [higher_trust_company, lower_trust_company].each do |company|
      ActiveRecord::Base.connection.execute(
        "INSERT INTO company_ranking_score (company_id, score, breakdown, computed_at, created_at, updated_at) VALUES (#{company.id}, 100, '{\"base_trust\": 10, \"recent_engagement\": 0}', NOW(), NOW(), NOW())"
      )
    end
    CompanyTrustScore.create!(company: higher_trust_company, score: 80, components: {}, computed_at: now)
    CompanyTrustScore.create!(company: lower_trust_company, score: 60, components: {}, computed_at: now)
  end

  it 'is idempotent for the same logical snapshot date' do
    described_class.call(now: now)
    described_class.call(now: now + 2.hours)

    snapshots = CompanyRankingSnapshot.where(
      company: higher_trust_company,
      scope_type: 'global',
      definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
      snapshot_date: now.in_time_zone('America/Sao_Paulo').to_date
    )

    expect(snapshots.count).to eq(1)
    expected_data_through = Time.use_zone('America/Sao_Paulo') do
      now.in_time_zone('America/Sao_Paulo').to_date.yesterday.end_of_day
    end
    expect(snapshots.first.data_through.to_f).to be_within(0.000001).of(expected_data_through.to_f)
  end

  it 'uses the published deterministic tie-break chain' do
    described_class.call(now: now)

    ranking = CompanyRankingSnapshot.where(
      scope_type: 'global',
      definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
      snapshot_date: now.in_time_zone('America/Sao_Paulo').to_date
    ).order(:rank_position)

    expect(ranking.pluck(:company_id)).to eq([higher_trust_company.id, lower_trust_company.id])
    expect(ranking.pluck(:rank_position)).to eq([1, 2])
  end
end
