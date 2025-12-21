# frozen_string_literal: true

require 'json'
require 'set'

module Locations
  class BrLocations
    DATA_PATH = Rails.root.join('config', 'data', 'br_locations.json')

    class << self
      def data
        @data ||= load_data
      end

      def states
        @states ||= data.fetch('states', []).map do |state|
          { 'acronym' => state['acronym'], 'name' => state['name'] }
        end
      end

      def cities_for(uf)
        key = normalize_uf(uf)
        return [] if key.blank?

        index_data!
        @cities_by_state[key] || []
      end

      def valid_state?(uf)
        key = normalize_uf(uf)
        return false if key.blank?

        index_data!
        @states_by_acronym.key?(key)
      end

      def valid_city?(uf, city)
        key = normalize_uf(uf)
        city_key = normalize_city_key(city)
        return false if key.blank? || city_key.blank?

        index_data!
        cities = @cities_by_state_normalized[key]
        cities ? cities.include?(city_key) : false
      end

      private

      def load_data
        unless File.exist?(DATA_PATH)
          raise "Arquivo de localidades não encontrado. Execute `bundle exec rake locations:sync_from_csv` para gerar #{DATA_PATH}."
        end

        JSON.parse(File.read(DATA_PATH))
      end

      def index_data!
        return if @indexed

        @states_by_acronym = {}
        @cities_by_state = {}
        @cities_by_state_normalized = {}

        data.fetch('states', []).each do |state|
          acronym = normalize_uf(state['acronym'])
          next if acronym.blank?

          @states_by_acronym[acronym] = state
          cities = Array(state['cities']).map { |city| normalize_city_value(city) }.compact
          @cities_by_state[acronym] = cities
          @cities_by_state_normalized[acronym] = cities.map { |city| normalize_city_key(city) }.to_set
        end

        @indexed = true
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
