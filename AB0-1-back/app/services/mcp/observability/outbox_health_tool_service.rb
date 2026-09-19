# frozen_string_literal: true

module Mcp
  module Observability
    class OutboxHealthToolService < Mcp::BaseService
      def call
        ::Observability::OutboxMetrics.collect
      end
    end
  end
end
