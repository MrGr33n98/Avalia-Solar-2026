# frozen_string_literal: true

module Geo
  # Fórmula de Haversine para cálculo de distância entre dois pontos geográficos.
  # Usada como fallback quando OpenSearch está indisponível.
  class HaversineCalculator
    EARTH_RADIUS_KM = 6371.0

    class << self
      # Calcula distância em km entre dois pontos geográficos
      # @param lat1 [Float] latitude do ponto 1
      # @param lng1 [Float] longitude do ponto 1
      # @param lat2 [Float] latitude do ponto 2
      # @param lng2 [Float] longitude do ponto 2
      # @return [Float] distância em km
      def distance_km(lat1, lng1, lat2, lng2)
        return nil if [lat1, lng1, lat2, lng2].any?(&:nil?)

        phi1 = to_rad(lat1)
        phi2 = to_rad(lat2)
        delta_phi = to_rad(lat2 - lat1)
        delta_lambda = to_rad(lng2 - lng1)

        a = Math.sin(delta_phi / 2)**2 +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta_lambda / 2)**2

        2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
      end

      # Filtra um scope ActiveRecord de empresas por raio (Haversine puro em Ruby)
      # Nota: para grandes volumes, prefira o filtro via OpenSearch geo_distance.
      # @param companies [Array<Company>] lista de empresas (já carregadas)
      # @param lat [Float] latitude de origem
      # @param lng [Float] longitude de origem
      # @param radius_km [Float] raio em km
      # @return [Array<Company>] empresas dentro do raio, com distancia_km injetada
      def filter_within_radius(companies, lat:, lng:, radius_km:)
        return companies if [lat, lng, radius_km].any?(&:nil?)

        companies.filter_map do |company|
          next unless company.latitude.present? && company.longitude.present?

          dist = distance_km(lat.to_f, lng.to_f, company.latitude.to_f, company.longitude.to_f)
          next if dist.nil? || dist > radius_km.to_f

          # Injeta a distância calculada diretamente no objeto para uso posterior
          company.define_singleton_method(:distance_km) { dist.round(1) }
          company
        end
      end

      # Gera SQL Haversine para uso diretamente em consultas ActiveRecord
      # Retorna companies dentro do raio ordenadas por distância
      # @param scope [ActiveRecord::Relation]
      # @param lat [Float]
      # @param lng [Float]
      # @param radius_km [Float]
      # @return [ActiveRecord::Relation]
      def scope_within_radius(scope, lat:, lng:, radius_km:)
        return scope if [lat, lng, radius_km].any?(&:nil?)

        # Fórmula Haversine em SQL puro (PostgreSQL)
        haversine_sql = <<~SQL.squish
          (6371 * acos(
            LEAST(1.0, cos(radians(#{lat.to_f}))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(#{lng.to_f}))
            + sin(radians(#{lat.to_f}))
            * sin(radians(latitude)))
          ))
        SQL

        scope
          .where('latitude IS NOT NULL AND longitude IS NOT NULL')
          .where("#{haversine_sql} <= ?", radius_km.to_f)
          .select("companies.*, (#{haversine_sql}) AS distance_km")
          .order(Arel.sql("#{haversine_sql} ASC"))
      end

      private

      def to_rad(degrees)
        degrees.to_f * Math::PI / 180.0
      end
    end
  end
end
