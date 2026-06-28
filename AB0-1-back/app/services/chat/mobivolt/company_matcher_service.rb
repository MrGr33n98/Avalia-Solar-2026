# frozen_string_literal: true

module Chat
  module Mobivolt
    # Matches active companies against extracted entities using location priority:
    #
    #  Priority 1 — Exact city seat:       company.city == entity_city
    #  Priority 2 — Coverage city:         coverage_cities contains entity_city
    #  Priority 3 — Exact state seat:      company.state == entity_state
    #  Priority 4 — Coverage state:        coverage_states contains entity_state
    #
    # For solar vertical, prioritises segment = 'installer'.
    # Returns up to MAX_RESULTS companies ordered by priority_score / sponsorship.
    #
    class CompanyMatcherService
      MAX_RESULTS = 5
      INSTALLER_MIN = 3

      def self.match(entities)
        new(entities).match
      end

      def initialize(entities)
        @entities = entities || {}
      end

      def match
        state = Locations::CoverageNormalizer.normalize_state(@entities[:state])
        city = Locations::CoverageNormalizer.normalize_city(@entities[:city],
                                                            state: state) || @entities[:city].to_s.strip

        # Broad SQL scope: active installers (or all for non-solar) in the state
        relation = Company.active.installers

        # Apply broad SQL pre-filter by state to reduce Ruby-level work
        relation = relation.serving_state(state) if state.present?

        if @entities[:category_seo_url].present?
          category = Category.find_by(seo_url: @entities[:category_seo_url])
          relation = relation.joins(:categories).where(categories: { id: category.id }) if category.present?
        elsif @entities[:keyword].present?
          relation = relation.search_by_text(@entities[:keyword])
        end

        candidates = relation.ordered_by_priority.to_a

        # Ruby-level refinement: filter by location support (city or state match)
        candidates = candidates.select { |c| supports_location?(c, city, state) } if city.present? || state.present?

        # Score and sort
        candidates
          .map { |c| [c, location_score(c, city, state)] }
          .sort_by { |_, score| -score }
          .first(MAX_RESULTS)
          .map(&:first)

        # If fewer than INSTALLER_MIN installers, results are all installers already;
        # no fallback to other segments is needed here (handled upstream if required).
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyMatcher] Error matching companies: #{e.message}")
        Company.none
      end

      private

      # ─── Location helpers ───────────────────────────────────────────────────

      def supports_location?(company, city, state)
        return true if city.present? && company.serves_city?(city, state)

        return true if state.present? && company.serves_state?(state)

        false
      end

      def location_score(company, city, state)
        score = 0

        if city.present?
          if Locations::CoverageNormalizer.city_slug(company.city) == Locations::CoverageNormalizer.city_slug(city)
            score += 40
          elsif company.coverage_city_list.any? do |coverage_city|
            Locations::CoverageNormalizer.city_slug(coverage_city) == Locations::CoverageNormalizer.city_slug(city)
          end
            score += 35
          end
        end

        if state.present?
          if Locations::CoverageNormalizer.normalize_state(company.state) == state
            score += 20
          elsif company.coverage_state_list.include?(state)
            score += 15
          end
        end

        score
      end
    end
  end
end
