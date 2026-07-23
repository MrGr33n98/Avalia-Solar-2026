# frozen_string_literal: true

module CompanyDashboard
  # Builds a deterministic, auditable read model.  The source score was already
  # calculated by RankingScoreWorker from trust + recent engagement.
  class RankingSnapshotWriter
    VERSION = CompanyRankingSnapshot::DEFINITION_VERSION

    def self.call(now: Time.current)
      new(now: now).call
    end

    def initialize(now:)
      @now = now
    end

    def call
      write_scope('global', nil, Company.active)
      Category.find_each do |category|
        write_scope('category', category.id, Company.active.joins(:categories).where(categories: { id: category.id }).distinct)
      end
    end

    private

    def write_scope(scope_type, scope_id, relation)
      companies = relation.joins('INNER JOIN company_ranking_score crs ON crs.company_id = companies.id')
                          .joins('LEFT JOIN company_trust_score cts ON cts.company_id = companies.id')
                          .select('companies.id, crs.score AS ranking_score, crs.breakdown AS ranking_breakdown, cts.computed_at AS trust_computed_at')
                          .order(Arel.sql('crs.score DESC, companies.id ASC')).to_a
      population = companies.length
      return if population.zero?

      rows = companies.each_with_index.map do |company, index|
        position = index + 1
        {
          company_id: company.id, scope_type: scope_type, scope_id: scope_id,
          definition_version: VERSION, score: company.ranking_score,
          rank_position: position, population_size: population,
          percentile: (((population - position + 1).to_f / population) * 100).round(2),
          breakdown: (company.ranking_breakdown || {}).merge('ranking_purpose' => 'organic_performance', 'sponsored_included' => false),
          quality_flags: quality_flags(company), data_through: @now, computed_at: @now,
          created_at: @now, updated_at: @now
        }
      end
      CompanyRankingSnapshot.insert_all!(rows)
    end

    def quality_flags(company)
      flags = []
      flags << 'trust_score_missing' if company.trust_computed_at.nil?
      flags << 'stale_trust_score' if company.trust_computed_at && company.trust_computed_at < 26.hours.ago
      flags
    end
  end
end
