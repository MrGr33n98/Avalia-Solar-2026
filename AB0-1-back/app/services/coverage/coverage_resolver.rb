# frozen_string_literal: true

module Coverage
  class CoverageResolver
    attr_reader :company, :purpose

    def initialize(company, purpose: :ranking)
      @company = company
      @purpose = purpose.to_sym
    end

    def resolve(target_city: nil, target_state: nil, target_territory: nil)
      territory = target_territory || resolve_territory(target_city, target_state)
      state_code = territory&.state_code || target_state&.to_s&.strip&.upcase
      city_name = territory&.municipality? ? territory.name : target_city&.to_s&.strip

      # Check active company service areas
      active_areas = find_active_service_areas

      # 1. National coverage
      if active_areas.any? { |a| a.coverage_type == 'national' }
        return CoverageResult.new(
          status: :covered,
          match_basis: :national,
          source: :company_service_area,
          trust_level: :declared,
          reason: :explicit_national_coverage,
          target_territory: territory&.canonical_id || "BR-#{state_code}",
          company_id: company&.id
        )
      end

      # 2. State coverage
      if state_code.present? && active_areas.any? { |a| a.coverage_type == 'state' && a.state_code&.upcase == state_code }
        return CoverageResult.new(
          status: :covered,
          match_basis: :state,
          source: :company_service_area,
          trust_level: :declared,
          reason: :explicit_state_coverage,
          target_territory: territory&.canonical_id || "BR-#{state_code}",
          company_id: company&.id
        )
      end

      # 3. City coverage
      if city_name.present? && state_code.present?
        city_match = active_areas.find do |a|
          a.coverage_type == 'city' &&
            a.state_code&.upcase == state_code &&
            normalize_name(a.city_name) == normalize_name(city_name)
        end

        if city_match
          return CoverageResult.new(
            status: :covered,
            match_basis: :city,
            source: :company_service_area,
            trust_level: :declared,
            reason: :explicit_city_coverage,
            target_territory: territory&.canonical_id || "BR-#{state_code}-#{normalize_name(city_name)}",
            company_id: company&.id
          )
        end
      end

      # 4. Radius guard: explicitly unsupported as territorial proof
      radius_areas = active_areas.select { |a| a.coverage_type == 'radius' }
      if radius_areas.any? && state_code.present? && radius_areas.any? { |a| a.state_code&.upcase == state_code }
        return CoverageResult.new(
          status: :unsupported,
          match_basis: :none,
          source: :company_service_area,
          trust_level: :unverified,
          reason: :radius_unsupported_as_territorial_proof,
          target_territory: territory&.canonical_id,
          company_id: company&.id,
          metadata: { radius_count: radius_areas.size }
        )
      end

      # 5. Headquarters fallback (for search/recommendation only)
      if company.respond_to?(:state) && company.state&.upcase == state_code
        hq_city_matches = city_name.blank? || normalize_name(company.city) == normalize_name(city_name)
        if hq_city_matches
          return CoverageResult.new(
            status: @purpose == :ranking ? :not_covered : :covered,
            match_basis: :headquarters,
            source: :headquarters,
            trust_level: :declared,
            reason: :headquarters_match,
            target_territory: territory&.canonical_id,
            company_id: company&.id
          )
        end
      end

      # 6. Default: Not covered
      CoverageResult.new(
        status: :not_covered,
        match_basis: :none,
        source: :none,
        trust_level: :unknown,
        reason: :no_matching_coverage_area,
        target_territory: territory&.canonical_id,
        company_id: company&.id
      )
    end

    private

    def find_active_service_areas
      return [] unless company.respond_to?(:company_service_areas)

      areas = company.company_service_areas
      if areas.respond_to?(:where)
        areas.where(is_active: true)
      else
        Array(areas).select { |a| a.respond_to?(:is_active) ? a.is_active : true }
      end
    end

    def resolve_territory(city, state)
      return nil if state.blank?

      if city.present?
        Territory.municipality(city, uf: state)
      else
        Territory.state(state)
      end
    end

    def normalize_name(str)
      return '' if str.blank?

      ActiveSupport::Inflector.transliterate(str.to_s).downcase.strip
    end
  end
end
