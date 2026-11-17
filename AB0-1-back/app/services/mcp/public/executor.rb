# frozen_string_literal: true

module Mcp
  module Public
    # Independent public-only dispatcher. No dynamic constantize,
    # no mapping to ToolsController::TOOL_REGISTRY, no arbitrary SQL.
    class Executor
      DIRECTORY_TOOLS = %w[
        list_integrators
        show_integrator_profile
        list_solar_categories
      ].freeze

      class << self
        def call(name:, arguments:, principal:)
          raise InputValidator::Invalid, 'Unknown public tool.' unless Mcp::PublicToolRegistry.names.include?(name)
          raise InputValidator::Invalid, 'Tool not available in the current release.' unless DIRECTORY_TOOLS.include?(name)

          DirectoryService.new(principal: principal).call(name: name, arguments: arguments)
        end
      end
    end
  end
end
