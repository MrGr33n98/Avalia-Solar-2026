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

        # Broad SQL scope: active companies
        relation = Company.respond_to?(:active) ? Company.active : Company.where(status: 'active')
        if relation.respond_to?(:installers)
          relation = relation.installers
        elsif Company.column_names.include?('segment')
          installer_relation = relation.where(segment: 'installer')
          relation = installer_relation if installer_relation.exists?
        end

        # Apply broad SQL pre-filter by state to reduce Ruby-level work
        if state.present? && relation.respond_to?(:serving_state)
          state_filtered = relation.serving_state(state)
          relation = state_filtered if state_filtered.exists?
        end

        if @entities[:category_seo_url].present?
          category = Category.find_by(seo_url: @entities[:category_seo_url]) || Category.find_by(slug: @entities[:category_seo_url])
          if category.present?
            cat_company_ids = Company.joins(:categories).where(categories: { id: category.id }).pluck(:id).uniq
            cat_relation = relation.where(id: cat_company_ids)
            relation = cat_relation if cat_relation.exists?
          end
        elsif @entities[:keyword].present? && relation.respond_to?(:search_by_text)
          relation = relation.search_by_text(@entities[:keyword])
        end

        candidates = relation.respond_to?(:ordered_by_priority) ? relation.ordered_by_priority.to_a : relation.order(rating_avg: :desc, rating_count: :desc).to_a

        # Ruby-level refinement: filter by location support (city or state match)
        if city.present? || state.present?
          loc_candidates = candidates.select { |c| supports_location?(c, city, state) }
          candidates = loc_candidates if loc_candidates.any?
        end

        # Score and sort
        results = candidates
          .map { |c| [c, location_score(c, city, state)] }
          .sort_by { |_, score| -score }
          .first(MAX_RESULTS)
          .map(&:first)

        # Fallback to top rated active companies if no matching candidates found
        if results.empty?
          results = Company.where(status: 'active').order(rating_avg: :desc, rating_count: :desc).first(MAX_RESULTS)
        end

        results
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::CompanyMatcher] Error matching companies: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        Company.where(status: 'active').order(rating_avg: :desc, rating_count: :desc).first(MAX_RESULTS)
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
