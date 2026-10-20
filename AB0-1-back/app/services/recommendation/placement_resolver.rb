# frozen_string_literal: true

module Recommendation
  class PlacementResolver
    def self.call(context:, eligible_company_ids:)
      new(context: context, eligible_company_ids: eligible_company_ids).call
    end

    def initialize(context:, eligible_company_ids:)
      @context = context
      @eligible_company_ids = eligible_company_ids
    end

    def call
      if context.context_company_id.present?
        context_company = Company.find_by(id: context.context_company_id)
        if context_company&.has_paid_plan?
          # Empresas com plano pago ativo são estritamente protegidas contra anúncios patrocinados concorrentes
          return { sponsored: [], pinned: [] }
        end
      end

      active_placements = RecommendationPlacement.active_now
                                                   .where(company_id: eligible_company_ids)
                                                   .includes(:company)

      if context.state.present?
        active_placements = active_placements.where('state_code IS NULL OR state_code = ?', context.state)
      end

      if context.category_slug.present?
        category = Category.find_by(slug: context.category_slug)
        if category
          active_placements = active_placements.where('category_id IS NULL OR category_id = ?', category.id)
        end
      elsif context.category_id.present?
        active_placements = active_placements.where('category_id IS NULL OR category_id = ?', context.category_id)
      end

      # Filter out expired or max_impressions reached placements
      placements = active_placements.select { |p| p.active_for? }

      sponsored_placements = placements.select { |p| p.placement_type == 'sponsored' }
                                         .sort_by(&:slot_position)

      pinned_placements = placements.select { |p| p.placement_type == 'pinned' }
                                     .sort_by(&:slot_position)

      {
        sponsored: sponsored_placements,
        pinned: pinned_placements
      }
    end

    private

    attr_reader :context, :eligible_company_ids
  end
end
