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
        show_storefront_profile
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
          when 'show_storefront_profile'
            slug = arguments['slug']
            company_id = arguments['company_id']
            company = if slug.present?
                        Company.find_by(slug: slug)
                      elsif company_id.present?
                        Company.find_by(id: company_id)
                      end
            raise InputValidator::Invalid, 'Company not found or inactive.' unless company&.active_status?

            ::Storefront::PublicProfileService.new(company: company).call
          else
            DirectoryService.new(principal: principal).call(name: name, arguments: arguments)
          end
        end
      end
    end
  end
end
