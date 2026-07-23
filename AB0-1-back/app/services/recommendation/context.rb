# frozen_string_literal: true

module Recommendation
  class Context
    attr_reader :city, :state, :category_slug, :segment, :visitor_id, :location_source, :device_type

    def initialize(city: nil, state: nil, category_slug: nil, segment: nil, visitor_id: nil, location_source: :fallback, device_type: :desktop)
      @city = city.presence&.strip
      @state = state.presence&.strip&.upcase
      @category_slug = category_slug.presence&.strip
      @segment = segment.presence&.strip
      @visitor_id = visitor_id
      @location_source = location_source.to_sym
      @device_type = device_type.to_sym
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
