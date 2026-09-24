# frozen_string_literal: true

module Coverage
  class ReconciliationClassifier
    ClassificationResult = Struct.new(
      :company_id,
      :status, # :equal, :legacy_only, :relation_only, :divergent, :none
      :legacy_states,
      :legacy_cities,
      :relation_states,
      :relation_cities,
      :flags, # [:has_national, :has_radius, :has_inactive, :unknown_tokens]
      :divergence_details,
      keyword_init: true
    )

    def self.classify(company)
      new(company).classify
    end

    def initialize(company)
      @company = company
    end

    def classify
      legacy_states = extract_legacy_states
      legacy_cities = extract_legacy_cities

      areas = @company.respond_to?(:company_service_areas) ? @company.company_service_areas.to_a : []
      active_areas = areas.select { |a| a.respond_to?(:is_active?) ? a.is_active? : a.is_active }

      flags = []
      flags << :has_inactive if areas.any? { |a| a.respond_to?(:is_active?) ? !a.is_active? : !a.is_active }
      flags << :has_national if active_areas.any? { |a| a.coverage_type == 'national' }
      flags << :has_radius if active_areas.any? { |a| a.coverage_type == 'radius' }

      relation_states = active_areas.select { |a| a.coverage_type == 'state' && a.state_code.present? }
                                    .map { |a| a.state_code.to_s.upcase }
                                    .sort.uniq

      relation_cities = active_areas.select { |a| a.coverage_type == 'city' && a.city_name.present? }
                                    .map { |a| a.city_name.to_s.strip.downcase }
                                    .sort.uniq

      unknown_tokens = detect_unknown_tokens
      flags << :unknown_tokens if unknown_tokens.any?

      has_legacy = legacy_states.any? || legacy_cities.any?
      has_relation = active_areas.any?

      status = determine_status(
        has_legacy: has_legacy,
        has_relation: has_relation,
        legacy_states: legacy_states,
        relation_states: relation_states,
        legacy_cities: legacy_cities,
        relation_cities: relation_cities,
        flags: flags
      )

      divergence_details = {}
      if status == :divergent
        divergence_details[:states_in_legacy_only] = legacy_states - relation_states
        divergence_details[:states_in_relation_only] = relation_states - legacy_states
        divergence_details[:cities_in_legacy_only] = legacy_cities - relation_cities
        divergence_details[:cities_in_relation_only] = relation_cities - legacy_cities
        divergence_details[:unknown_tokens] = unknown_tokens if unknown_tokens.any?
        divergence_details[:has_national] = true if flags.include?(:has_national)
        divergence_details[:has_radius] = true if flags.include?(:has_radius)
      end

      ClassificationResult.new(
        company_id: @company.id,
        status: status,
        legacy_states: legacy_states,
        legacy_cities: legacy_cities,
        relation_states: relation_states,
        relation_cities: relation_cities,
        flags: flags,
        divergence_details: divergence_details
      )
    end

    private

    def extract_legacy_states
      if @company.respond_to?(:coverage_state_list)
        @company.coverage_state_list.map(&:to_s).map(&:upcase).sort.uniq
      elsif @company.respond_to?(:coverage_states) && @company.coverage_states.present?
        Array(@company.coverage_states).flatten.map(&:to_s).map(&:upcase).sort.uniq
      else
        []
      end
    end

    def extract_legacy_cities
      if @company.respond_to?(:coverage_city_list)
        @company.coverage_city_list.map(&:to_s).map(&:strip).map(&:downcase).sort.uniq
      elsif @company.respond_to?(:coverage_cities) && @company.coverage_cities.present?
        Array(@company.coverage_cities).flatten.map(&:to_s).map(&:strip).map(&:downcase).sort.uniq
      else
        []
      end
    end

    def determine_status(has_legacy:, has_relation:, legacy_states:, relation_states:, legacy_cities:, relation_cities:, flags:)
      if !has_legacy && !has_relation
        :none
      elsif has_legacy && !has_relation
        :legacy_only
      elsif !has_legacy && has_relation
        :relation_only
      elsif flags.include?(:has_national) || flags.include?(:has_radius)
        # National or radius in relations is richer/different than plain discrete legacy lists
        :divergent
      elsif legacy_states == relation_states && legacy_cities == relation_cities
        :equal
      else
        :divergent
      end
    end

    def detect_unknown_tokens
      raw_states = @company.respond_to?(:coverage_states) ? @company.coverage_states : nil
      raw_cities = @company.respond_to?(:coverage_cities) ? @company.coverage_cities : nil

      unknowns = []
      if raw_states.is_a?(String) && raw_states.match?(/[\{\}\[\]"']/i)
        unknowns << "malformed_json_state_string: #{raw_states[0..30]}"
      end
      if raw_cities.is_a?(String) && raw_cities.match?(/[\{\}\[\]"']/i)
        unknowns << "malformed_json_city_string: #{raw_cities[0..30]}"
      end
      unknowns
    end
  end
end
