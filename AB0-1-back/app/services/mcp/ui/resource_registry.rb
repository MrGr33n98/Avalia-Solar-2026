# frozen_string_literal: true

require 'uri'

module Mcp
  module Ui
    # Allowlisted registry and static HTML bundle reader for MCP Apps UI surfaces.
    # Feature-flagged OFF by default in production; never accepts arbitrary file paths.
    class ResourceRegistry
      MIME_TYPE = 'text/html;profile=mcp-app'
      UI_FLAG = 'MCP_UI_ENABLED'

      SURFACES = {
        'list_integrators' => {
          key: 'search',
          file: 'search.v1.html',
          uri: 'ui://avalia-solar/search/v1.html',
          name: 'Avalia Solar Search',
          description: 'Grade interativa com empresas integradoras, notas, cidade/UF e verificação no Avalia Solar.',
          flag: 'MCP_UI_SEARCH_ENABLED',
          display_modes: %w[inline fullscreen]
        }.freeze,
        'show_integrator_profile' => {
          key: 'profile',
          file: 'profile.v1.html',
          uri: 'ui://avalia-solar/profile/v1.html',
          name: 'Avalia Solar Profile',
          description: 'Perfil completo do integrador solar com serviços, região atendida e selo de verificação.',
          flag: 'MCP_UI_PROFILE_ENABLED',
          display_modes: %w[inline fullscreen]
        }.freeze,
        'get_integrator_reputation' => {
          key: 'reputation',
          file: 'reputation.v1.html',
          uri: 'ui://avalia-solar/reputation/v1.html',
          name: 'Avalia Solar Reputation',
          description: 'Painel de reputação do integrador com média de notas, total de avaliações e distribuição.',
          flag: 'MCP_UI_REPUTATION_ENABLED',
          display_modes: %w[inline fullscreen]
        }.freeze,
        'compare_integrators' => {
          key: 'compare',
          file: 'compare.v1.html',
          uri: 'ui://avalia-solar/compare/v1.html',
          name: 'Avalia Solar Compare',
          description: 'Tabela comparativa lado a lado entre 2 ou 3 empresas integradoras.',
          flag: 'MCP_UI_COMPARE_ENABLED',
          display_modes: %w[fullscreen inline]
        }.freeze,
        'list_solar_categories' => {
          key: 'categories',
          file: 'categories.v1.html',
          uri: 'ui://avalia-solar/categories/v1.html',
          name: 'Avalia Solar Categories',
          description: 'Diretório interativo de categorias solares e filtro rápido para pesquisar integradores.',
          flag: 'MCP_UI_CATEGORIES_ENABLED',
          display_modes: %w[inline fullscreen]
        }.freeze,
        'show_storefront_profile' => {
          key: 'storefront',
          file: 'storefront.v1.html',
          uri: 'ui://avalia-solar/storefront/v1.html',
          name: 'Avalia Solar Storefront',
          description: 'Vitrine digital completa do integrador solar com catálogo de produtos, projetos executados e simulador.',
          flag: 'MCP_UI_STOREFRONT_ENABLED',
          display_modes: %w[fullscreen inline]
        }.freeze
      }.freeze

      PROFILE_V2 = SURFACES.fetch('show_integrator_profile').merge(
        uri: 'ui://avalia-solar/profile/v2.html'
      ).freeze
      URI_INDEX = SURFACES.values.index_by { |entry| entry[:uri] }.freeze

      CANARY_FLAGS = %w[MCP_UI_STOREFRONT_ENABLED].freeze

      class << self
        def enabled?
          ENV[UI_FLAG] == 'true'
        end

        def surface_enabled?(entry)
          return false unless enabled? && entry.present?

          if CANARY_FLAGS.include?(entry[:flag])
            ENV[entry[:flag]] == 'true'
          else
            ENV[entry[:flag]] != 'false'
          end
        end

        def server_capabilities
          return { tools: {} } unless enabled?

          {
            tools: {},
            resources: { listChanged: false },
            extensions: {
              'io.modelcontextprotocol/ui' => {
                mimeTypes: [MIME_TYPE]
              }
            }
          }
        end

        def list
          return [] unless enabled?

          SURFACES.keys.filter_map do |name|
            entry = surface_for(name)
            next unless surface_enabled?(entry) && safe_bundle_path(entry)

            {
              'uri' => entry[:uri],
              'name' => entry[:name],
              'mimeType' => MIME_TYPE,
              '_meta' => resource_meta(entry)
            }
          end
        end

        def read(uri)
          return nil unless enabled? && uri.is_a?(String)

          entry = if uri == PROFILE_V2[:uri] && profile_v2_enabled?
                    PROFILE_V2
                  else
                    URI_INDEX[uri]
                  end
          return nil unless surface_enabled?(entry)

          path = safe_bundle_path(entry)
          return nil unless path

          {
            'uri' => entry[:uri],
            'mimeType' => MIME_TYPE,
            'text' => File.binread(path).force_encoding('UTF-8'),
            '_meta' => resource_meta(entry)
          }
        end

        def tool_meta(tool_name)
          entry = surface_for(tool_name.to_s)
          return nil unless surface_enabled?(entry) && safe_bundle_path(entry)

          {
            'ui' => {
              'resourceUri' => entry[:uri],
              'visibility' => %w[model app]
            },
            'ui/resourceUri' => entry[:uri],
            'openai/outputTemplate' => entry[:uri],
            'openai/widgetAccessible' => true,
            'openai/widgetPrefersBorder' => true,
            'openai/widgetDescription' => entry[:description]
          }
        end

        private

        def profile_v2_enabled?
          %w[
            MCP_BRAND_PROFILE_HERO_ENABLED MCP_BRAND_PROFILE_PORTFOLIO_ENABLED
            MCP_BRAND_PROFILE_GALLERY_ENABLED MCP_BRAND_PROFILE_CATALOG_ENABLED MCP_BRAND_PROFILE_TRUST_ENABLED
          ]
            .any? { |flag| ENV[flag] == 'true' }
        end

        def surface_for(name)
          return PROFILE_V2 if name == 'show_integrator_profile' && profile_v2_enabled?

          SURFACES[name]
        end

        def base_dir
          raw = ENV['MCP_UI_DIST_DIR'].to_s.strip
          Pathname.new(raw.presence || Rails.root.join('public', 'mcp-ui').to_s)
        end

        def safe_bundle_path(entry)
          dir = base_dir
          return nil unless File.directory?(dir)

          real_dir = File.realpath(dir)
          candidate = File.join(real_dir, entry[:file])
          return nil unless File.file?(candidate)

          real_file = File.realpath(candidate)
          real_file.start_with?("#{real_dir}/") ? real_file : nil
        rescue SystemCallError
          nil
        end

        def resource_meta(entry)
          ui_meta = {
            'prefersBorder' => true,
            'csp' => {
              'connectDomains' => [],
              'resourceDomains' => allowed_resource_domains,
              'frameDomains' => []
            }
          }
          origin = safe_https_origin(ENV.fetch('MCP_UI_ORIGIN', nil))
          ui_meta['domain'] = origin if origin

          {
            'ui' => ui_meta,
            'openai/ui' => { 'availableDisplayModes' => entry[:display_modes] },
            'openai/widgetPrefersBorder' => true,
            'openai/widgetDescription' => entry[:description]
          }
        end

        def allowed_resource_domains
          ENV['MCP_UI_RESOURCE_DOMAINS'].to_s.split(',').filter_map do |raw|
            safe_https_origin(raw)
          end.uniq
        end

        def safe_https_origin(raw)
          value = raw.to_s.strip
          return nil if value.empty? || value.include?('*')

          uri = URI.parse(value)
          return nil unless uri.is_a?(URI::HTTPS) && uri.host.present?

          format_https_origin(uri)
        rescue URI::InvalidURIError
          nil
        end

        def format_https_origin(uri)
          return "https://#{uri.host}" if uri.port.nil? || uri.port == 443

          "https://#{uri.host}:#{uri.port}"
        end
      end
    end
  end
end
