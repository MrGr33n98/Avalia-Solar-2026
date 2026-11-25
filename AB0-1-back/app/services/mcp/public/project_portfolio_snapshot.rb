# frozen_string_literal: true

module Mcp
  module Public
    # Prévia pública limitada, sem metadados internos nem mídia externa arbitrária.
    class ProjectPortfolioSnapshot
      LIMIT = 3
      IMAGE_LIMIT = 4

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
        images = gallery_images(project)
        {
          id: project.id, title: text(project.title, 160), summary: text(project.summary, 300),
          city: text(project.city, 100), state: text(project.state, 10),
          technology: text(project.technology, 100), segment: text(project.segment, 100),
          capacity_value: project.capacity_value&.to_f, capacity_unit: text(project.capacity_unit, 20),
          cover_url: images.first, gallery_images: images
        }
      end

      def text(value, limit)
        ActionController::Base.helpers.strip_tags(value.to_s).strip.first(limit)
      end

      def gallery_images(project)
        assets = project.digital_assets.published.where(company_id: @company.id, kind: 'image')
                        .with_attached_file.order(id: :asc).limit(IMAGE_LIMIT)
        assets.filter_map { |asset| MediaUrl.allowed(asset.file_url) if asset.file.attached? }.uniq
      end
    end
  end
end
