# frozen_string_literal: true

module CategoryDiscovery
  class LocalPagePolicy
    MIN_CITY_ELIGIBLE_COMPANIES = 2
    MIN_STATE_ELIGIBLE_COMPANIES = 1

    Decision = Struct.new(
      :indexable,
      :robots,
      :reason_codes,
      :eligible_companies_count,
      :verified_companies_count,
      keyword_init: true
    )

    def self.evaluate(scope:, state:, city: nil)
      return non_indexable('INVALID_STATE', 0, 0) if state.blank?

      clean_scope = scope.except(:includes, :preload, :eager_load, :order)
      total_count = clean_scope.distinct.count('companies.id')
      verified_count = if ::Company.column_names.include?('verified')
                         clean_scope.where(companies: { verified: true }).distinct.count('companies.id')
                       else
                         0
                       end

      evaluate_counts(
        total_count: total_count,
        verified_count: verified_count,
        state: state,
        city: city
      )
    end

    def self.evaluate_counts(total_count:, verified_count:, state:, city: nil)
      return non_indexable('INVALID_STATE', 0, 0) if state.blank?

      reason_codes = []

      if total_count.zero?
        reason_codes << 'NOINDEX_LOCAL_EMPTY'
      elsif city.present?
        if total_count < MIN_CITY_ELIGIBLE_COMPANIES
          reason_codes << 'NOINDEX_DOORWAY_CITY_SINGLE_COMPANY'
        elsif verified_count.zero? && total_count < 3
          reason_codes << 'NOINDEX_DOORWAY_CITY_UNVERIFIED_COVERAGE'
        end
      elsif total_count < MIN_STATE_ELIGIBLE_COMPANIES
        reason_codes << 'NOINDEX_STATE_INSUFFICIENT_COVERAGE'
      end

      indexable = reason_codes.empty?
      Decision.new(
        indexable: indexable,
        robots: indexable ? 'index,follow' : 'noindex,follow',
        reason_codes: reason_codes,
        eligible_companies_count: total_count,
        verified_companies_count: verified_count
      )
    end

    def self.non_indexable(code, total_count, verified_count)
      Decision.new(
        indexable: false,
        robots: 'noindex,follow',
        reason_codes: [code],
        eligible_companies_count: total_count,
        verified_companies_count: verified_count
      )
    end
  end
end

