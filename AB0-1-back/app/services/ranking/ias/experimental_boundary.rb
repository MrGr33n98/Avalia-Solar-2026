# frozen_string_literal: true

module Ranking
  module Ias
    class ExperimentalBoundary
      class MethodologicalApprovalError < StandardError; end

      attr_reader :definition

      def initialize(definition: nil)
        @definition = definition
      end

      def approved?
        @definition&.dig(:approved) == true
      end

      def execute_score(_input_data)
        unless approved?
          raise MethodologicalApprovalError,
                'IAS score execution refused: methodology formula is unapproved and uncalibrated.'
        end

        nil
      end

      def to_h
        {
          namespace: 'experimental/ias',
          status: approved? ? :approved : :unapproved,
          score_execution_allowed: false,
          isolated_from_organic: true
        }
      end
    end
  end
end
