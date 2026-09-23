# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class ScopeResolver
      attr_reader :requested_scope

      # rubocop:disable Metrics/ParameterLists
      def initialize(category_id: nil, state: nil, city: nil, sector: nil,
                     minimum_population: RankingBenchmarkService.min_comparable_population,
                     population_loader: nil, eligibility_checker: nil)
        @requested_scope = scope_hash(category_id: category_id, state: state, city: city, sector: sector)
        @minimum_population = minimum_population.to_i
        @population_loader = population_loader || method(:default_population)
        @eligibility_checker = eligibility_checker
      end
      # rubocop:enable Metrics/ParameterLists

      def resolve
        candidates.each do |candidate|
          population = @population_loader.call(candidate)
          assessment = assess(population)
          return result(candidate, population, assessment) if assessment[:status] == 'ready'

          @last_failure = assessment
        end

        candidate = candidates.last
        population = @population_loader.call(candidate)
        result(candidate, population, @last_failure || assess(population))
      end

      private

      def candidates
        @candidates ||= [@requested_scope, *fallback_candidates].then do |scopes|
          scopes << scope_hash(category_id: @requested_scope[:category_id]) if @requested_scope[:category_id].present?
          scopes << scope_hash if @requested_scope[:category_id].blank?
          scopes.uniq
        end
      end

      def fallback_candidates
        case @requested_scope[:type]
        when 'city' then city_fallbacks
        when 'state' then state_fallbacks
        when 'sector', 'category' then [scope_hash(category_id: @requested_scope[:category_id])]
        else []
        end
      end

      def city_fallbacks
        [scope_hash(
          category_id: @requested_scope[:category_id],
          state: @requested_scope[:state],
          sector: @requested_scope[:sector]
        )]
      end

      def state_fallbacks
        [scope_hash(category_id: @requested_scope[:category_id], sector: @requested_scope[:sector])]
      end

      def result(scope, population, assessment)
        {
          requested_scope: @requested_scope,
          resolved_scope: scope,
          population: population,
          assessment: assessment,
          fallback: scope != @requested_scope,
          fallback_reason: scope == @requested_scope ? nil : 'insufficient_sample'
        }
      end

      def assess(population)
        return @eligibility_checker.call(population) if @eligibility_checker

        { status: population.length >= @minimum_population ? 'ready' : 'insufficient_sample' }
      end

      def default_population(scope)
        RankingEligibilityScope.new(**scope.slice(:category_id, :state, :city, :sector)).relation.to_a
      end

      def scope_hash(category_id: nil, state: nil, city: nil, sector: nil)
        values = {
          category_id: category_id&.to_i,
          state: state.to_s.strip.upcase.presence,
          city: city.to_s.strip.presence,
          sector: sector.to_s.strip.presence
        }
        type = if values[:city].present?
                 'city'
               elsif values[:state].present?
                 'state'
               elsif values[:sector].present?
                 'sector'
               elsif values[:category_id].present?
                 'category'
               else
                 'global'
               end
        values.merge(type: type)
      end
    end
  end
end
