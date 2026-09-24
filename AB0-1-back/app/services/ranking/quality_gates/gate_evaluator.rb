# frozen_string_literal: true

module Ranking
  module QualityGates
    class EvaluationSummary
      attr_reader :gate_results

      def initialize(gate_results = [])
        @gate_results = gate_results
      end

      def passed?
        # Only fails if there are errors blocking ranking_publication
        !@gate_results.any? { |r| r.failed? && r.blocking_for?(:ranking_publication) }
      end

      def analysis_available?
        analysis_gate = @gate_results.find { |r| r.layer == :analysis_availability }
        analysis_gate.nil? || analysis_gate.passed?
      end

      def results_by_layer
        @gate_results.group_by(&:layer)
      end

      def to_h
        {
          passed: passed?,
          analysis_available: analysis_available?,
          gates: @gate_results.map(&:to_h)
        }
      end
    end

    class GateEvaluator
      attr_reader :min_population

      def initialize(min_population: 1)
        @min_population = min_population
      end

      def evaluate(scope, population_count: 0, company: nil)
        results = []

        # Layer 1: Company eligibility
        if company
          eligible = company.respond_to?(:verified?) ? company.verified? : true
          results << GateResult.new(
            layer: :company_eligibility,
            status: eligible ? :passed : :failed,
            reason: eligible ? :company_verified : :company_unverified,
            blocking_for: [:ranking_publication]
          )
        end

        # Layer 2: Population validity
        has_min_pop = population_count >= @min_population
        results << GateResult.new(
          layer: :population_validity,
          status: has_min_pop ? :passed : :failed,
          reason: has_min_pop ? :sufficient_population : :insufficient_population,
          observed: population_count,
          required: @min_population,
          blocking_for: [:ranking_publication]
        )

        # Layer 3: Ranking publicability
        publicable = has_min_pop
        results << GateResult.new(
          layer: :ranking_publicability,
          status: publicable ? :passed : :failed,
          reason: publicable ? :eligible_for_publication : :publication_gate_closed,
          blocking_for: [:ranking_publication]
        )

        # Layer 4: Analysis availability (e.g. benchmark/quadrant)
        # Separate from ranking publicability: failed analysis does NOT block organic ranking!
        analysis_ready = population_count >= 5
        results << GateResult.new(
          layer: :analysis_availability,
          status: analysis_ready ? :passed : :unavailable,
          reason: analysis_ready ? :benchmark_eligible : :benchmark_population_unavailable,
          observed: population_count,
          required: 5,
          severity: :info,
          blocking_for: [:analysis]
        )

        EvaluationSummary.new(results)
      end
    end
  end
end
