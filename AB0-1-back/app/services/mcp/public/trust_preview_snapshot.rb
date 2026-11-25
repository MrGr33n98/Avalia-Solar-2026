# frozen_string_literal: true

module Mcp
  module Public
    # Somente selos ativos atribuídos e FAQ pública autorizada pelo plano.
    class TrustPreviewSnapshot
      def self.call(company)
        new(company).call
      end

      def initialize(company)
        @company = company
      end

      def call
        { state: 'ready', badges: badges, faqs: faqs }
      rescue StandardError => e
        Rails.logger.warn("[MCP trust] company_id=#{@company.id} error=#{e.class}")
        { state: 'error', badges: [], faqs: [] }
      end

      private

      def badges
        @company.badges.active.order(position: :asc, id: :asc).limit(4).map do |badge|
          { id: badge.id, name: text(badge.name, 120), image_url: MediaUrl.allowed(badge.image_url) }
        end
      end

      def faqs
        access = @company.feature_access['faq_block']
        allowed = if access.present?
                    access['state'] == 'enabled' && access['value'] != false
                  else
                    @company.feature_enabled_from_plan?(:faq_block, :faq, :faqs, include_defaults: true)
                  end
        return [] unless allowed

        @company.company_faqs.published_only.ordered.order(id: :asc).limit(4).map do |faq|
          { id: faq.id, question: text(faq.question, 160), answer: text(faq.answer, 600) }
        end
      end

      def text(value, limit)
        ActionController::Base.helpers.strip_tags(value.to_s).strip.first(limit)
      end
    end
  end
end
