# frozen_string_literal: true

# Proposed public MCP discovery catalog. This is intentionally separate from
# Api::V1::Mcp::ToolsController::TOOL_REGISTRY, which contains private, mutable,
# administrative and revenue tools. It does NOT expose a network endpoint.
module Mcp
  class PublicToolRegistry
    CONTRACT_VERSION = '1.0.0'
    MAX_LIMIT = 20
    SERVICES_FLAG = 'MCP_PUBLIC_COMPANY_SERVICES_ENABLED'
    PUBLIC_NAMES = %w[
      list_integrators
      show_integrator_profile
      list_solar_categories
      get_integrator_reputation
      compare_integrators
      show_storefront_profile
    ].freeze

    STRING_FILTER = { 'type' => 'string', 'minLength' => 1, 'maxLength' => 120 }.freeze
    PUBLIC_ID = { 'type' => 'integer', 'minimum' => 1 }.freeze
    PAGE_LIMIT = { 'type' => 'integer', 'minimum' => 1, 'maximum' => MAX_LIMIT }.freeze
    CURSOR = { 'type' => 'string', 'minLength' => 1, 'maxLength' => 512 }.freeze

    class << self
      def list
        names.map { |name| find(name) }
      end

      def find(name)
        return nil if name.to_s == 'get_company_services' && !services_enabled?

        entry = CATALOG[name.to_s]
        return nil unless entry

        # Prevent client callers from mutating canonical nested tool schemas.
        definition = JSON.parse(JSON.generate(entry.fetch('public')))
        ui_meta = Mcp::Ui::ResourceRegistry.tool_meta(name)
        definition['_meta'] = ui_meta if ui_meta
        definition
      end

      def names
        PUBLIC_NAMES.dup.tap { |names| names << 'get_company_services' if services_enabled? }
      end

      def services_enabled?
        ENV[SERVICES_FLAG] == 'true'
      end

      # For the future protocol adapter only. Does not dispatch or grant access.
      def internal_source(name)
        CATALOG.dig(name.to_s, 'internal_source')
      end

      private

      def schema(properties:, required: [], conditions: nil)
        value = {
          'type' => 'object',
          'properties' => properties,
          'required' => required,
          'additionalProperties' => false
        }
        value.merge!(conditions) if conditions
        value
      end

      def envelope(payload_fields, payload_required)
        schema(
          properties: {
            'schema_version' => { 'type' => 'string', 'const' => CONTRACT_VERSION },
            'data_as_of' => { 'type' => 'string', 'format' => 'date-time' },
            'source_type' => {
              'type' => 'string',
              'enum' => %w[company_declared platform_verified review_aggregate platform_derived unknown]
            },
            'data' => schema(properties: payload_fields, required: payload_required),
            'limitations' => { 'type' => 'array', 'items' => { 'type' => 'string' } }
          },
          required: %w[schema_version data_as_of source_type data limitations]
        )
      end

      def tool(name, title:, description:, input:, output:, source:)
        {
          'public' => {
            'name' => name,
            'title' => title,
            'description' => description,
            'inputSchema' => input,
            'outputSchema' => output,
            'annotations' => {
              'title' => title,
              'readOnlyHint' => true,
              'destructiveHint' => false,
              'idempotentHint' => true,
              'openWorldHint' => false
            }
          },
          'internal_source' => source
        }
      end
    end

    COMPANY_REFERENCE = schema(
      properties: { 'company_id' => PUBLIC_ID, 'slug' => STRING_FILTER },
      conditions: { 'oneOf' => [{ 'required' => ['company_id'] }, { 'required' => ['slug'] }] }
    )

    CATALOG = {
      'list_integrators' => tool(
        'list_integrators',
        title: 'Pesquisar integradores solares',
        description: 'Lista empresas ativas por nome, categoria ou sede; cidade da sede não implica atendimento local.',
        source: 'Mcp::SearchCompaniesService',
        input: schema(
          properties: {
            'query' => STRING_FILTER,
            'category_slug' => STRING_FILTER,
            'headquarters_city' => STRING_FILTER,
            'state' => { 'type' => 'string', 'minLength' => 2, 'maxLength' => 2 },
            'verified' => { 'type' => 'boolean' },
            'limit' => PAGE_LIMIT,
            'cursor' => CURSOR,
            'sort' => { 'type' => 'string', 'enum' => %w[relevance rating review_count] }
          },
          conditions: {
            'anyOf' => %w[query category_slug headquarters_city state].map { |field| { 'required' => [field] } }
          }
        ),
        output: envelope(
          {
            'integrators' => { 'type' => 'array', 'items' => { 'type' => 'object' } },
            'next_cursor' => { 'type' => %w[string null] }
          },
          ['integrators']
        )
      ),
      'show_integrator_profile' => tool(
        'show_integrator_profile',
        title: 'Consultar perfil público',
        description: 'Exibe apenas dados públicos de empresa ativa com cobertura identificada como declarada.',
        source: 'Mcp::CompanyProfileService',
        input: COMPANY_REFERENCE,
        output: envelope({ 'integrator' => { 'type' => 'object' } }, ['integrator'])
      ),
      'list_solar_categories' => tool(
        'list_solar_categories',
        title: 'Listar categorias de energia solar',
        description: 'Consulta a taxonomia de categorias ativas, incluindo hierarquia quando disponível.',
        source: 'Category.active',
        input: schema(
          properties: {
            'parent_id' => PUBLIC_ID,
            'vertical' => STRING_FILTER,
            'limit' => PAGE_LIMIT,
            'cursor' => CURSOR
          }
        ),
        output: envelope(
          {
            'categories' => { 'type' => 'array', 'items' => { 'type' => 'object' } },
            'next_cursor' => { 'type' => %w[string null] }
          },
          ['categories']
        )
      ),
      'get_integrator_reputation' => tool(
        'get_integrator_reputation',
        title: 'Consultar reputação pública',
        description: 'Agrega somente avaliações aprovadas; sem avaliações a média deve ser nula, não zero.',
        source: 'Mcp::ReviewsSummaryService',
        input: COMPANY_REFERENCE,
        output: envelope(
          {
            'total_approved' => { 'type' => 'integer', 'minimum' => 0 },
            'average_rating' => { 'type' => %w[number null], 'minimum' => 1, 'maximum' => 5 },
            'rating_distribution' => { 'type' => 'object' },
            'verified_total' => { 'type' => 'integer', 'minimum' => 0 },
            'replied_total' => { 'type' => 'integer', 'minimum' => 0 },
            'sample_size' => { 'type' => 'integer', 'minimum' => 0 }
          },
          %w[total_approved average_rating rating_distribution verified_total replied_total sample_size]
        )
      ),
      'get_company_services' => tool(
        'get_company_services',
        title: 'Consultar serviços de uma empresa',
        description: 'Lista até cinco serviços ativos da vitrine pública de uma empresa ativa por ID ou slug. Não comprova disponibilidade ou preço.',
        source: 'Catalog::ShowcaseQuery',
        input: schema(
          properties: { 'company_id' => PUBLIC_ID, 'slug' => STRING_FILTER,
                        'limit' => { 'type' => 'integer', 'minimum' => 1, 'maximum' => 5 } },
          conditions: { 'oneOf' => [{ 'required' => ['company_id'] }, { 'required' => ['slug'] }] }
        ),
        output: envelope(
          {
            'company' => schema(properties: { 'id' => PUBLIC_ID, 'name' => { 'type' => 'string' },
                                               'slug' => { 'type' => 'string' }, 'profile_url' => { 'type' => 'string' } },
                                required: %w[id name slug profile_url]),
            'services' => { 'type' => 'array', 'maxItems' => 5, 'items' => schema(
              properties: { 'id' => { 'type' => 'string' }, 'name' => { 'type' => 'string' },
                            'summary' => { 'type' => 'string' }, 'category' => { 'type' => 'string' },
                            'image_url' => { 'type' => %w[string null] }, 'detail_url' => { 'type' => %w[string null] } },
              required: %w[id name summary category image_url detail_url]
            ) },
            'total_count' => { 'type' => 'integer', 'minimum' => 0 },
            'has_more' => { 'type' => 'boolean' }
          },
          %w[company services total_count has_more]
        )
      ),
      'compare_integrators' => tool(
        'compare_integrators',
        title: 'Comparar integradores',
        description: 'Compara 2 a 3 empresas ativas por critérios públicos, sem declarar vencedor absoluto.',
        source: 'Mcp::CompareCompaniesService',
        input: schema(
          properties: {
            'company_ids' => {
              'type' => 'array',
              'minItems' => 2,
              'maxItems' => 3,
              'uniqueItems' => true,
              'items' => {
                'oneOf' => [PUBLIC_ID, STRING_FILTER]
              }
            },
            'criteria' => {
              'type' => 'array',
              'uniqueItems' => true,
              'items' => {
                'type' => 'string',
                'enum' => %w[reputation categories headquarters declared_coverage services]
              }
            }
          },
          required: ['company_ids']
        ),
        output: envelope(
          {
            'companies' => { 'type' => 'array', 'minItems' => 2, 'maxItems' => 3, 'items' => { 'type' => 'object' } },
            'comparison_matrix' => { 'type' => 'object' },
            'unknown_fields' => { 'type' => 'array', 'items' => { 'type' => 'string' } },
            'criteria_used' => { 'type' => 'array', 'items' => { 'type' => 'string' } }
          },
          %w[companies comparison_matrix unknown_fields criteria_used]
        )
      ),
      'show_storefront_profile' => tool(
        'show_storefront_profile',
        title: 'Consultar vitrine do integrador (Storefront)',
        description: 'Exibe a vitrine interativa pública de um integrador solar com catálogo de produtos, marcas parceiras, portfólio de projetos e simulador.',
        source: 'Storefront::PublicProfileService',
        input: COMPANY_REFERENCE,
        output: envelope(
          {
            'company' => schema(
              properties: {
                'id' => PUBLIC_ID,
                'name' => { 'type' => 'string' },
                'slug' => STRING_FILTER,
                'verified' => { 'type' => 'boolean' },
                'logo_url' => { 'type' => %w[string null] },
                'headquarters' => { 'type' => 'object' },
                'rating' => { 'type' => %w[number null] },
                'review_count' => { 'type' => 'integer', 'minimum' => 0 }
              },
              required: %w[id name slug verified headquarters review_count]
            ),
            'settings' => { 'type' => 'object' },
            'projects' => { 'type' => 'array', 'items' => { 'type' => 'object' } },
            'curated_products' => { 'type' => 'array', 'items' => { 'type' => 'object' } }
          },
          %w[company settings projects curated_products]
        )
      )
    }.freeze
  end
end
