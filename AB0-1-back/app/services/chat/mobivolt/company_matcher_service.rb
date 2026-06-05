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
        city  = normalize(@entities[:city])
        state = normalize_state(@entities[:state])

        # Broad SQL scope: active installers (or all for non-solar) in the state
        relation = Company.active.installers

        # Apply broad SQL pre-filter by state to reduce Ruby-level work
        if state.present?
          relation = relation.where(
            "UPPER(companies.state) = :s OR UPPER(companies.coverage_states) LIKE :like",
            s:    state.upcase,
            like: "%#{state.upcase}%"
          )
        end

        if @entities[:category_seo_url].present?
          category = Category.find_by(seo_url: @entities[:category_seo_url])
          relation = relation.joins(:categories).where(categories: { id: category.id }) if category.present?
        elsif @entities[:keyword].present?
          relation = relation.search_by_text(@entities[:keyword])
        end

        candidates = relation.ordered_by_priority.to_a

        # Ruby-level refinement: filter by location support (city or state match)
        if city.present? || state.present?
          candidates = candidates.select { |c| supports_location?(c, city, state) }
        end

        # Score and sort
        ranked = candidates
                   .map    { |c| [c, location_score(c, city, state)] }
                   .sort_by { |_, score| -score }
                   .first(MAX_RESULTS)
                   .map(&:first)

        # If fewer than INSTALLER_MIN installers, results are all installers already;
        # no fallback to other segments is needed here (handled upstream if required).
        ranked
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyMatcher] Error matching companies: #{e.message}")
        Company.none
      end

      private

      # ─── Location helpers ───────────────────────────────────────────────────

      def normalize(value)
        return '' if value.blank?

        value.to_s
             .unicode_normalize(:nfd)
             .gsub(/\p{Mn}/, '')
             .downcase
             .strip
      rescue Encoding::CompatibilityError
        value.to_s.downcase.strip
      end

      def normalize_state(value)
        value.to_s.strip.upcase
      end

      def parse_coverage_list(raw)
        return [] if raw.blank?

        text = raw.to_s.strip
        items =
          if text.start_with?('[')
            begin; JSON.parse(text); rescue JSON::ParserError; []; end
          else
            text.split(/[;,\n\r]+/)
          end

        items.map { |v| normalize(v) }.reject(&:blank?)
      end

      def parse_state_list(raw)
        return [] if raw.blank?

        raw.to_s.split(/[;,\n\r]+/).map { |v| v.strip.upcase }.reject(&:blank?)
      end

      def supports_location?(company, city, state)
        if city.present?
          return true if normalize(company.city) == city
          return true if parse_coverage_list(company.coverage_cities).include?(city)
        end

        if state.present?
          return true if company.state.to_s.strip.upcase == state
          return true if parse_state_list(company.coverage_states).include?(state)
        end

        false
      end

      def location_score(company, city, state)
        score = 0

        if city.present?
          if normalize(company.city) == city
            score += 40
          elsif parse_coverage_list(company.coverage_cities).include?(city)
            score += 35
          end
        end

        if state.present?
          if company.state.to_s.strip.upcase == state
            score += 20
          elsif parse_state_list(company.coverage_states).include?(state)
            score += 15
          end
        end

        score
      end
    end
  end
end
