# frozen_string_literal: true

module Geo
  # Carrega o arquivo city_centroids.json e fornece coordenadas aproximadas (centroide)
  # das principais cidades brasileiras para uso como fallback de geocoding.
  class CityCentroidService
    DATA_PATH = Rails.root.join('config', 'data', 'city_centroids.json')

    class << self
      # Retorna { lat: Float, lng: Float } ou nil
      # @param state [String] sigla do estado (ex: "MT")
      # @param city [String] nome da cidade (ex: "Cuiabá")
      def coordinates_for(state:, city:)
        return nil if state.blank? || city.blank?

        state_key = state.to_s.strip.upcase
        city_data = data.dig(state_key, normalize_city(city))
        return nil unless city_data

        { lat: city_data['lat'].to_f, lng: city_data['lng'].to_f }
      end

      private

      def data
        @data ||= load_data
      end

      def load_data
        return {} unless File.exist?(DATA_PATH)

        raw = JSON.parse(File.read(DATA_PATH))
        # Normaliza as chaves de cidades para busca insensível a acentos
        raw.transform_values do |cities|
          cities.each_with_object({}) do |(city_name, coords), acc|
            acc[normalize_city(city_name)] = coords
          end
        end
      rescue JSON::ParserError => e
        Rails.logger.error "[Geo::CityCentroidService] Erro ao carregar city_centroids.json: #{e.message}"
        {}
      end

      def normalize_city(name)
        ActiveSupport::Inflector.transliterate(name.to_s.strip).downcase
      end
    end
  end
end
