# frozen_string_literal: true

module Coverage
  class ShadowComparator
    ShadowResult = Struct.new(
      :company_id,
      :consumer,
      :target_state,
      :target_city,
      :legacy_covered,
      :canonical_covered,
      :canonical_reason,
      :canonical_status,
      :authorized_for_ranking,
      :match_type, # :agreement_covered, :agreement_not_covered, :legacy_false_positive, :legacy_false_negative
      keyword_init: true
    )

    def self.compare(company, state:, city: nil, consumer: 'default')
      new(company, state: state, city: city, consumer: consumer).compare
    end

    def initialize(company, state:, city: nil, consumer: 'default')
      @company = company
      @state = state.to_s.strip.upcase.presence
      @city = city.to_s.strip.presence
      @consumer = consumer
    end

    def compare
      legacy_covered = evaluate_legacy
      canonical_res = Coverage::CoverageResolver.resolve(@company, state: @state, city: @city)
      canonical_covered = canonical_res.covered?

      match_type = determine_match_type(legacy_covered, canonical_covered)

      ShadowResult.new(
        company_id: @company.id,
        consumer: @consumer,
        target_state: @state,
        target_city: @city,
        legacy_covered: legacy_covered,
        canonical_covered: canonical_covered,
        canonical_reason: canonical_res.reason,
        canonical_status: canonical_res.status,
        authorized_for_ranking: canonical_res.authorized_for?(:ranking),
        match_type: match_type
      )
    end

    private

    def evaluate_legacy
      if @city.present? && @company.respond_to?(:serves_city?)
        @company.serves_city?(@city, @state)
      elsif @state.present? && @company.respond_to?(:serves_state?)
        @company.serves_state?(@state)
      else
        false
      end
    rescue StandardError => e
      Rails.logger.warn("ShadowComparator legacy evaluation error: #{e.message}") if defined?(Rails)
      false
    end

    def determine_match_type(legacy, canonical)
      if legacy && canonical
        :agreement_covered
      elsif !legacy && !canonical
        :agreement_not_covered
      elsif legacy && !canonical
        :legacy_false_positive
      else
        :legacy_false_negative
      end
    end
  end
end
