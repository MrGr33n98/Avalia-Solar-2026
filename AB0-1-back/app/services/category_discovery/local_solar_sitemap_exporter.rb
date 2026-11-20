# frozen_string_literal: true

module CategoryDiscovery
  class LocalSolarSitemapExporter
    CACHE_KEY = 'sitemap_local_solar_v1'
    CACHE_TTL = 15.minutes

    class << self
      def call
        started_at = monotonic_time
        cache_hit = Rails.cache.exist?(CACHE_KEY)
        data = Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) { build_entries }
        duration_ms = ((monotonic_time - started_at) * 1000).round(2)

        Rails.logger.info(
          "[SEO][local_solar_sitemap] count=#{data.size} cache=#{cache_hit ? 'hit' : 'miss'} " \
          "duration_ms=#{duration_ms}"
        )

        {
          data: data,
          meta: {
            count: data.size,
            cache_hit: cache_hit,
            duration_ms: duration_ms,
            generated_at: Time.current.iso8601
          }
        }
      end

      private

      def build_entries
        companies = ::Company.active
                           .select(:state, :city, :coverage_states, :coverage_cities, :verified)
                           .to_a

        state_entries = ::Locations::CoverageNormalizer::BRAZIL_CAPITALS.filter_map do |location|
          decision = decision_for(companies, location[:state], city: nil)
          entry_for(location[:state], decision, priority: 0.7)
        end

        city_entries = ::Locations::CoverageNormalizer::BRAZIL_CAPITALS.filter_map do |location|
          decision = decision_for(companies, location[:state], city: location[:city])
          entry_for(location[:state], decision, city: location[:city], priority: 0.72)
        end

        state_entries + city_entries
      end

      def decision_for(companies, state, city: nil)
        matching = companies.select do |company|
          city.present? ? serves_city?(company, city, state) : serves_state?(company, state)
        end

        ::CategoryDiscovery::LocalPagePolicy.evaluate_counts(
          total_count: matching.size,
          verified_count: matching.count { |company| company.verified == true },
          state: state,
          city: city
        )
      end

      def entry_for(state, decision, city: nil, priority:)
        return unless decision.indexable

        path = if city.present?
                 ::Locations::CoverageNormalizer.local_solar_path(state, city)
               else
                 "/companies/energia-solar/#{state.downcase}"
               end

        { path: path, priority: priority, scope: city.present? ? 'city' : 'state' }
      end

      def serves_state?(company, state)
        company.state.to_s.upcase == state || state_token?(company.coverage_states, state)
      end

      def serves_city?(company, city, state)
        primary_state_matches = company.state.to_s.upcase == state
        primary_city_matches = company.city.to_s.downcase == city.to_s.downcase
        coverage_city_matches = company.coverage_cities.to_s.downcase.include?(city.to_s.downcase)

        (primary_state_matches && primary_city_matches) ||
          (coverage_city_matches && (primary_state_matches || state_token?(company.coverage_states, state)))
      end

      def state_token?(value, state)
        value.to_s.upcase.match?("(?:\\A|[,;|\\s])#{Regexp.escape(state)}(?:[,;|\\s]|\\z)")
      end

      def monotonic_time
        Process.clock_gettime(Process::CLOCK_MONOTONIC)
      end
    end
  end
end
