# frozen_string_literal: true

module Mcp
  module Observability
    class SystemHealthToolService < Mcp::BaseService
      def call
        deep = arguments.fetch(:deep, true)
        ::Observability::SystemHealthService.check(deep: deep)
      end
    end
  end
end
