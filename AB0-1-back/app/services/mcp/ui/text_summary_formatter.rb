# frozen_string_literal: true

module Mcp
  module Ui
    # Human-readable Portuguese fallback text for MCP text-only clients and UI-off mode.
    # Never exposes private fields; preserves domain invariants verbatim.
    class TextSummaryFormatter
      FORMATTERS = {
        'list_integrators' => :format_integrators,
        'show_integrator_profile' => :format_profile,
        'list_solar_categories' => :format_categories,
        'get_integrator_reputation' => :format_reputation,
        'compare_integrators' => :format_comparison,
        'get_company_services' => :format_services
      }.freeze

      class << self
        def call(name:, payload:)
          handler = FORMATTERS[name.to_s]
          return JSON.generate(payload) unless handler

          raw_data = payload.is_a?(Hash) ? (payload['data'] || payload[:data] || {}) : {}
          send(handler, raw_data.deep_stringify_keys)
        rescue StandardError
          JSON.generate(payload)
        end

        private

        def format_integrators(data)
          items = Array(data['integrators'])
          return 'Nenhum integrador ativo encontrado para os filtros informados.' if items.empty?

          lines = items.first(5).map { |item| format_integrator_line(item) }
          "Encontrados #{items.size} integradores ativos (sede não comprova cobertura):\n#{lines.join("\n")}"
        end

        def format_integrator_line(item)
          hq = item['headquarters'] || {}
          loc = [hq['city'], hq['state']].compact.join('/')
          count = item['rating_count'].to_i
          rating = item['rating_average']
          nota = count.positive? && rating ? "nota #{rating}/5 (#{count})" : 'sem avaliações'
          "- #{item['name']} (#{loc}) — #{nota}"
        end

        def format_profile(data)
          item = data['integrator'] || {}
          hq = item['headquarters'] || {}
          loc = [hq['city'], hq['state']].compact.join('/')
          verified = item['verification_state'] == 'platform_verified'
          status = verified ? 'verificada' : 'não verificada'
          "#{item['name']} (#{loc}, status: #{status}). Perfil público: #{item['profile_url']}"
        end

        def format_categories(data)
          items = Array(data['categories'])
          return 'Nenhuma categoria solar ativa disponível.' if items.empty?

          names = items.first(10).map { |c| "#{c['name']} (#{c['slug']})" }
          "Categorias solares ativas (#{items.size}): #{names.join(', ')}."
        end

        def format_reputation(data)
          total = data['total_approved'].to_i
          return 'Sem avaliações públicas aprovadas; nota média não atribuída.' if total.zero?

          "Reputação pública: nota #{data['average_rating']}/5 baseada em #{total} avaliações aprovadas."
        end

        def format_services(data)
          company = data.fetch('company', {})
          services = Array(data['services'])
          return "Nenhum serviço ativo publicado por #{company['name']}." if services.empty?

          lines = services.map { |item| "- #{item['name']}: #{item['summary']} (#{item['detail_url'] || company['profile_url']})" }
          "Serviços publicados por #{company['name']} (#{services.size} de #{data['total_count']}):\n#{lines.join("\n")}\nDisponibilidade deve ser confirmada com a empresa."
        end

        def format_comparison(data)
          names = Array(data['companies']).map { |c| c['name'] }
          "Comparação informativa (sem vencedor absoluto) entre: #{names.join(', ')}."
        end
      end
    end
  end
end
