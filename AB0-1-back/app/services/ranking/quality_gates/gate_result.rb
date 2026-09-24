# frozen_string_literal: true

module Ranking
  module QualityGates
    class GateResult
      STATUSES = %i[passed failed unavailable].freeze
      LAYERS = %i[
        company_eligibility
        population_validity
        ranking_publicability
        analysis_availability
      ].freeze

      attr_reader :layer, :status, :reason, :observed, :required, :severity, :blocking_for

      def initialize(
        layer:,
        status:,
        reason: nil,
        observed: nil,
        required: nil,
        severity: :error,
        blocking_for: [:ranking_publication]
      )
        @layer = layer.to_sym
        @status = status.to_sym
        @reason = reason&.to_sym
        @observed = observed
        @required = required
        @severity = severity.to_sym
        @blocking_for = Array(blocking_for).map(&:to_sym)
      end

      def passed?
        @status == :passed
      end

      def failed?
        @status == :failed
      end

      def unavailable?
        @status == :unavailable
      end

      def blocking_for?(activity)
        @blocking_for.include?(activity.to_sym)
      end

      def to_h
        {
          layer: @layer,
          status: @status,
          reason: @reason,
          observed: @observed,
          required: @required,
          severity: @severity,
          blocking_for: @blocking_for
        }
      end
    end
  end
end
