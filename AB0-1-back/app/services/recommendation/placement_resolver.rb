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
      active_placements = RecommendationPlacement.active_now
                                                   .where(company_id: eligible_company_ids)
                                                   .includes(:company)

      if context.state.present?
        active_placements = active_placements.where('state_code IS NULL OR state_code = ?', context.state)
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
