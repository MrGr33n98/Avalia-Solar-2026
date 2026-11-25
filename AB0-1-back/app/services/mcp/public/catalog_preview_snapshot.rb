# frozen_string_literal: true

module Mcp
  module Public
    # Reaproveita a vitrine pública, não expõe ofertas, contatos ou dados internos.
    class CatalogPreviewSnapshot
      LIMIT = 3
      ORIGIN = 'https://www.avaliasolar.com.br'

      def self.call(company)
        new(company).call
      end

      def initialize(company)
        @company = company
      end

      def call
        products = showcase('all').select { |item| item[:type] == 'product' }
        services = showcase('services').select { |item| item[:type] == 'service' }
        { state: 'ready', products: serialize(products), services: serialize(services) }
      rescue StandardError => e
        Rails.logger.warn("[MCP catalog] company_id=#{@company.id} error=#{e.class}")
        { state: 'error', products: [], services: [] }
      end

      private

      def showcase(tab)
        Catalog::ShowcaseQuery.new(company: @company, tab: tab, limit: LIMIT).call.fetch(:data).fetch(:items)
      end

      def serialize(items)
        items.first(LIMIT).map do |item|
          {
            id: item.fetch(:id).to_s.first(80), name: text(item[:name], 160),
            summary: text(item[:short_description], 200),
            category: text(item.dig(:category, :name), 120),
            image_url: MediaUrl.allowed(item[:image_url]), detail_url: detail_url(item)
          }
        end
      end

      def detail_url(item)
        path = item.dig(:cta, :href).to_s
        allowed = if item[:type] == 'product'
                    path.match?(%r{\A/products/[a-z0-9]+(?:-[a-z0-9]+)*\z})
                  else
                    path.match?(%r{\A/companies/#{Regexp.escape(@company.slug.to_s)}/services/[a-z0-9]+(?:-[a-z0-9]+)*\z})
                  end
        "#{ORIGIN}#{path}" if allowed
      end

      def text(value, limit)
        ActionController::Base.helpers.strip_tags(value.to_s).strip.first(limit)
      end
    end
  end
end
