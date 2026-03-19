# frozen_string_literal: true

module Analytics
  class DimensionQuery
    SUPPORTED_DIMENSIONS = %w[brand].freeze

    attr_reader :dimension, :value, :label, :brand

    def initialize(dimension:, value:)
      @dimension = dimension.to_s
      @value = value.to_s
      validate_dimension!
      resolve_dimension!
    end

    def scope
      case dimension
      when 'brand'
        AnalyticsEvent.where(brand_id: brand&.id)
      else
        AnalyticsEvent.none
      end
    end

    def cache_key
      "#{dimension}:#{value}"
    end

    private

    def validate_dimension!
      return if SUPPORTED_DIMENSIONS.include?(dimension)

      raise ArgumentError, "Unsupported dimension: #{dimension}"
    end

    def resolve_dimension!
      case dimension
      when 'brand'
        @brand = Brand.find_by_value(value)
        raise ActiveRecord::RecordNotFound, 'Brand not found' unless brand
        @label = brand.slug
      end
    end
  end
end
