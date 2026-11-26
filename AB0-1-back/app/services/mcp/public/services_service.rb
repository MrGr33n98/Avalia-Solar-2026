# frozen_string_literal: true

module Mcp
  module Public
    # Public catalog preview only; uses the same eligibility as the Brand Page.
    class ServicesService
      ORIGIN = 'https://www.avaliasolar.com.br'

      def call(arguments:)
        args = InputValidator.normalize('get_company_services', arguments)
        company = args.key?('company_id') ? Company.active.find_by(id: args['company_id']) :
                                           Company.active.find_by(slug: args['slug'])
        raise DirectoryService::NotFound, 'Company not found.' unless company

        catalog = Catalog::ShowcaseQuery.new(company: company, tab: 'services', limit: args.fetch('limit')).call.fetch(:data)
        services = if catalog[:selected_tab] == 'services'
                     catalog.fetch(:items).select { |item| item[:type] == 'service' }
                            .first(args.fetch('limit')).map { |item| serialize(item, company) }
                   else
                     []
                   end
        total = catalog[:selected_tab] == 'services' ? catalog.fetch(:total_count) : 0
        {
          schema_version: Mcp::PublicToolRegistry::CONTRACT_VERSION,
          data_as_of: Time.current.utc.iso8601,
          source_type: 'company_declared',
          data: {
            company: { id: company.id, name: text(company.name, 160), slug: company.slug,
                       profile_url: "#{ORIGIN}/companies/#{company.slug}" },
            services: services, total_count: total, has_more: total > services.size
          },
          limitations: ['Serviços publicados pela empresa; disponibilidade e preços não foram verificados.',
                        'Prévia de até cinco serviços; consulte o perfil público para o catálogo completo.']
        }
      end

      private

      def serialize(item, company)
        path = item.dig(:cta, :href).to_s
        allowed = path.match?(%r{\A/companies/#{Regexp.escape(company.slug.to_s)}/services/[a-z0-9]+(?:-[a-z0-9]+)*\z})
        {
          id: item.fetch(:id).to_s.first(80), name: text(item[:name], 160),
          summary: text(item[:short_description], 200), category: text(item.dig(:category, :name), 120),
          image_url: MediaUrl.allowed(item[:image_url]), detail_url: allowed ? "#{ORIGIN}#{path}" : nil
        }
      end

      def text(value, limit)
        ActionController::Base.helpers.strip_tags(value.to_s).strip.first(limit)
      end
    end
  end
end
