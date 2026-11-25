# frozen_string_literal: true

require 'json'
require 'digest'

module Locations
  class BrLocations
    DATA_PATH = Rails.root.join('config', 'data', 'br_locations.json')
    INDEX_MUTEX = Mutex.new

    class << self
      def data
        @data ||= load_data
      end

      def states
        @states ||= data.fetch('states', []).map do |state|
          { 'acronym' => state['acronym'], 'name' => state['name'] }
        end
      end

      def cities_for(state_value)
        key = normalize_uf(state_value)
        return [] if key.blank?

        index_data!
        @cities_by_state[key] || []
      end

      def valid_state?(state_value)
        key = normalize_uf(state_value)
        return false if key.blank?

        index_data!
        @states_by_acronym.key?(key)
      end

      def valid_city?(state_value, city)
        key = normalize_uf(state_value)
        city_key = normalize_city_key(city)
        return false if key.blank? || city_key.blank?

        index_data!
        cities = @cities_by_state_normalized[key]
        cities ? cities.include?(city_key) : false
      end

      def revision
        @revision ||= Digest::SHA256.file(DATA_PATH).hexdigest
      end

      def warmup!
        index_data!

        {
          revision: revision,
          state_count: @states_by_acronym.size,
          city_count: @cities_by_state.values.sum(&:size)
        }
      end

      private

      def load_data
        unless File.exist?(DATA_PATH)
          raise(
            'Arquivo de localidades não encontrado. Execute `bundle exec rake locations:sync_from_csv` ' \
            "para gerar #{DATA_PATH}."
          )
        end

        JSON.parse(File.read(DATA_PATH))
      end

      def index_data!
        return if @indexed

        INDEX_MUTEX.synchronize do
          return if @indexed

          states_by_acronym, cities_by_state, cities_by_state_normalized = build_indexes
          @states_by_acronym = states_by_acronym
          @cities_by_state = cities_by_state
          @cities_by_state_normalized = cities_by_state_normalized
          @indexed = true
        end
      end

      def build_indexes
        data.fetch('states', []).each_with_object([{}, {}, {}]) do |state, indexes|
          acronym = normalize_uf(state['acronym'])
          next if acronym.blank?

          cities = Array(state['cities']).map { |city| normalize_city_value(city) }.compact
          indexes[0][acronym] = state
          indexes[1][acronym] = cities
          indexes[2][acronym] = cities.to_set { |city| normalize_city_key(city) }
        end
      end

      def normalize_uf(value)
        value.to_s.strip.upcase
      end

      def normalize_city_value(value)
        cleaned = value.to_s.strip.gsub(/\s+/, ' ')
        cleaned.presence
      end

      def normalize_city_key(value)
        cleaned = normalize_city_value(value)
        return '' if cleaned.blank?

        ActiveSupport::Inflector.transliterate(cleaned).downcase
      end
    end
  end
end
