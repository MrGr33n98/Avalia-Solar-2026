# frozen_string_literal: true

require 'uri'

module Mcp
  module Public
    # Prévia pública limitada, sem metadados internos nem mídia externa arbitrária.
    class ProjectPortfolioSnapshot
      LIMIT = 3

      def self.call(company)
        new(company).call
      end

      def initialize(company)
        @company = company
      end

      def call
        return unavailable unless @company.feature_enabled?('projects_showcase')

        records = @company.company_projects.published.ordered.order(id: :asc).limit(LIMIT + 1).to_a
        { state: 'ready', items: records.first(LIMIT).map { |project| serialize(project) },
          has_more: records.size > LIMIT }
      rescue StandardError => e
        Rails.logger.warn("[MCP portfolio] company_id=#{@company.id} error=#{e.class}")
        { state: 'error', items: [], has_more: false }
      end

      private

      def unavailable
        { state: 'unavailable', items: [], has_more: false }
      end

      def serialize(project)
        {
          id: project.id, title: text(project.title, 160), summary: text(project.summary, 300),
          city: text(project.city, 100), state: text(project.state, 10),
          technology: text(project.technology, 100), segment: text(project.segment, 100),
          capacity_value: project.capacity_value&.to_f, capacity_unit: text(project.capacity_unit, 20),
          cover_url: cover_url(project)
        }
      end

      def text(value, limit)
        ActionController::Base.helpers.strip_tags(value.to_s).strip.first(limit)
      end

      def cover_url(project)
        assets = project.digital_assets.published.where(company_id: @company.id, kind: 'image')
                        .with_attached_file.order(id: :asc).limit(3)
        assets.filter_map { |asset| allowed_url(asset.file_url) if asset.file.attached? }.first
      end

      def allowed_url(value)
        uri = URI.parse(value.to_s)
        return unless uri.is_a?(URI::HTTPS) && uri.host.present? && uri.userinfo.nil?

        origins = ENV['MCP_UI_RESOURCE_DOMAINS'].to_s.split(',').map(&:strip)
        origin = uri.port == 443 ? "https://#{uri.host}" : "https://#{uri.host}:#{uri.port}"
        value if origins.include?(origin) && value.bytesize <= 2048
      rescue URI::InvalidURIError
        nil
      end
    end
  end
end
