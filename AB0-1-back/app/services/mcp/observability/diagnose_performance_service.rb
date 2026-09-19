# frozen_string_literal: true

module Mcp
  module Observability
    class DiagnosePerformanceService < Mcp::BaseService
      def call
        window_minutes = arguments.fetch(:window_minutes, 15).to_i.clamp(1, 1440)
        ::Observability::PerformanceDiagnosticService.diagnose(window_minutes: window_minutes)
      end
    end
  end
end
