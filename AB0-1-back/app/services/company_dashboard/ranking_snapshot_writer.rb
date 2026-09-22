# frozen_string_literal: true

module CompanyDashboard
  # Builds a deterministic, auditable read model.  The source score was already
  # calculated by RankingScoreWorker from trust + recent engagement.
  class RankingSnapshotWriter
    VERSION = CompanyRankingSnapshot::DEFINITION_VERSION
    BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

    def self.call(now: Time.current)
      new(now: now).call
    end

    def initialize(now:)
      @now = now
      @snapshot_date = @now.in_time_zone(BUSINESS_TIME_ZONE).to_date
      @data_through = Time.use_zone(BUSINESS_TIME_ZONE) { @snapshot_date.yesterday.end_of_day }
    end

    def call
      snapshot_counts = [write_scope('global', nil, Company.active)]
      Category.find_each do |category|
        snapshot_counts << write_scope(
          'category', category.id, Company.active.where(id: category.companies.select('companies.id'))
        )
      end

      { scopes: snapshot_counts.length, snapshots: snapshot_counts.sum }
    end

    private

    def write_scope(scope_type, scope_id, relation)
      companies = relation.joins('INNER JOIN company_ranking_score crs ON crs.company_id = companies.id')
                          .joins('LEFT JOIN company_trust_score cts ON cts.company_id = companies.id')
                          .select(<<~SQL.squish)
                            companies.id, crs.score AS ranking_score, crs.breakdown AS ranking_breakdown,
                            cts.score AS trust_score, cts.computed_at AS trust_computed_at,
                            companies.reviews_count
                          SQL
                          .order(Arel.sql('crs.score DESC, COALESCE(cts.score, 0) DESC, companies.reviews_count DESC, companies.id ASC')).to_a
      population = companies.length
      return 0 if population.zero?

      rows = companies.each_with_index.map do |company, index|
        position = index + 1
        {
          company_id: company.id, scope_type: scope_type, scope_id: scope_id,
          definition_version: VERSION, score: company.ranking_score,
          rank_position: position, population_size: population,
          percentile: (((population - position + 1).to_f / population) * 100).round(2),
          breakdown: (company.ranking_breakdown || {}).merge(
            'ranking_purpose' => 'organic_performance',
            'sponsored_included' => false,
            'definition_version' => VERSION,
            'tie_breaker' => 'ranking_score desc, trust_score desc, reviews_count desc, company_id asc'
          ),
          quality_flags: quality_flags(company), snapshot_date: @snapshot_date,
          data_through: @data_through, computed_at: @now,
          created_at: @now, updated_at: @now
        }
      end
      CompanyRankingSnapshot.upsert_all(rows, unique_by: :idx_ranking_snapshots_daily)
      rows.length
    end

    def quality_flags(company)
      flags = []
      flags << 'trust_score_missing' if company.trust_computed_at.nil?
      flags << 'stale_trust_score' if company.trust_computed_at && company.trust_computed_at < 26.hours.ago
      flags
    end
  end
end
