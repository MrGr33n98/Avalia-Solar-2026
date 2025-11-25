# frozen_string_literal: true

# Common optimized scopes - TASK-022
# Include in models that need these patterns
module QueryOptimization
  module Scopes
    extend ActiveSupport::Concern

    included do
      # Paginate with default per_page
      scope :paginated, ->(page = 1, per_page = 25) {
        page(page).per(per_page)
      }

      # Efficiently count with cache
      def self.cached_count(cache_key = nil, expires_in: 5.minutes)
        key = cache_key || "#{table_name}/count"
        Rails.cache.fetch(key, expires_in: expires_in) do
          count
        end
      end

      # Batch process records efficiently
      def self.process_in_batches(batch_size: 100, &block)
        find_in_batches(batch_size: batch_size) do |batch|
          batch.each(&block)
        end
      end

      # Pluck multiple columns into hash
      def self.pluck_to_hash(*keys)
        pluck(*keys).map do |values|
          keys.zip(values).to_h
        end
      end

      # Select only IDs efficiently
      def self.ids_only
        select(:id).pluck(:id)
      end

      # Check existence efficiently (faster than .exists?)
      def self.any?
        limit(1).size > 0
      end
    end

    class_methods do
      # Eager load associations based on includes
      def with_associations(*associations)
        includes(*associations)
      end

      # Preload with conditions
      def preload_with(*associations)
        preload(*associations)
      end
    end
  end
end
