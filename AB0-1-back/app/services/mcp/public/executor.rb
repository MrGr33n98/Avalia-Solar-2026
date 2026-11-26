# frozen_string_literal: true

module Mcp
  module Public
    # Independent public-only dispatcher. No dynamic constantize,
    # no mapping to ToolsController::TOOL_REGISTRY, no arbitrary SQL.
    class Executor
      class NotAvailable < StandardError; end

      DIRECTORY_TOOLS = %w[
        list_integrators
        show_integrator_profile
        list_solar_categories
        get_integrator_reputation
        compare_integrators
        get_company_services
      ].freeze

      class << self
        def call(name:, arguments:, principal:)
          raise InputValidator::Invalid, 'Unknown public tool.' unless Mcp::PublicToolRegistry.names.include?(name)
          raise NotAvailable, 'Tool not available in the current release.' unless DIRECTORY_TOOLS.include?(name)

          case name
          when 'get_integrator_reputation'
            ReputationService.new.call(arguments: arguments)
          when 'get_company_services'
            ServicesService.new.call(arguments: arguments)
          when 'compare_integrators'
            ComparisonService.new.call(arguments: arguments)
          else
            DirectoryService.new(principal: principal).call(name: name, arguments: arguments)
          end
        end
      end
    end
  end
end
