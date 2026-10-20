# frozen_string_literal: true

module Recommendation
  class Context
    attr_reader :city, :state, :category_slug, :category_id, :segment, :visitor_id,
                :location_source, :device_type, :exclude_company_id, :context_company_id

    def initialize(city: nil, state: nil, category_slug: nil, category_id: nil, segment: nil,
                   visitor_id: nil, location_source: :fallback, device_type: :desktop,
                   exclude_company_id: nil, context_company_id: nil)
      @city = city.presence&.strip
      @state = state.presence&.strip&.upcase
      @category_slug = category_slug.presence&.strip
      @category_id = category_id.present? ? category_id.to_i : nil
      @segment = segment.presence&.strip
      @visitor_id = visitor_id
      @location_source = location_source.to_sym
      @device_type = device_type.to_sym
      @exclude_company_id = exclude_company_id.present? ? exclude_company_id.to_i : nil
      @context_company_id = context_company_id.present? ? context_company_id.to_i : nil
      freeze
    end

    def local?
      city.present? && state.present?
    end

    def state_only?
      city.blank? && state.present?
    end

    def national?
      city.blank? && state.blank?
    end
  end
end
