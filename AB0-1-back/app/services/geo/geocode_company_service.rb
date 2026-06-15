# frozen_string_literal: true

module Geo
  # Converte endereço/cidade de uma empresa em coordenadas geográficas (lat/lng).
  # Usa Nominatim/OSM como provedor principal (gratuito, sem API key).
  # Fallback 1: Nominatim com apenas cidade + estado.
  # Fallback 2: centroide da cidade via CityCentroidService (100% offline).
  #
  # IMPORTANTE: Este serviço NUNCA lança exceção. Erros são logados e
  # geocoding_status é definido como 'failed'. O cadastro da empresa
  # nunca é bloqueado por falha de geocoding.
  class GeocodeCompanyService
    NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'.freeze
    USER_AGENT = 'AvaliaSolar/1.0 (contact@avaliasolar.com.br)'.freeze
    RATE_LIMIT_SECONDS = 1.1 # Nominatim exige >= 1 req/seg

    STATUS_SUCCESS      = 'success'.freeze
    STATUS_CITY_FALLBACK = 'city_fallback'.freeze
    STATUS_FAILED       = 'failed'.freeze

    def initialize(company)
      @company = company
    end

    # @return [Boolean] true se geocoding foi bem-sucedido
    def call
      return false unless should_geocode?

      result = geocode_with_full_address ||
               geocode_with_city_state ||
               geocode_from_centroid

      if result
        @company.update_columns(
          latitude: result[:lat].round(6),
          longitude: result[:lng].round(6),
          geocoded_at: Time.current,
          geocoding_status: result[:status]
        )
        Rails.logger.info "[Geo] Empresa #{@company.id} geocodificada: lat=#{result[:lat]}, lng=#{result[:lng]}, status=#{result[:status]}"
        true
      else
        @company.update_columns(
          geocoding_status: STATUS_FAILED,
          geocoded_at: Time.current
        )
        Rails.logger.warn "[Geo] Empresa #{@company.id} não pôde ser geocodificada. Status: failed"
        false
      end
    rescue StandardError => e
      Rails.logger.error "[Geo] Erro inesperado ao geocodificar empresa #{@company.id}: #{e.message}"
      begin
        @company.update_columns(geocoding_status: STATUS_FAILED)
      rescue StandardError
        nil
      end
      false
    end

    private

    def should_geocode?
      # Respeita flag de feature
      return false unless ENV['SEARCH_GEO_ENABLED'] == 'true'

      # Não reprocessa empresas já geocodificadas com sucesso (a menos que admin force)
      return false if @company.geocoding_status == STATUS_SUCCESS && @company.latitude.present?

      # Precisa ter pelo menos cidade e estado
      @company.city.present? || @company.state.present?
    end

    # Tenta geocodificar com endereço completo
    def geocode_with_full_address
      address_parts = [
        @company.try(:street_address),
        @company.city,
        @company.state,
        'Brasil'
      ].compact.select(&:present?).join(', ')

      return nil if address_parts == 'Brasil'

      coords = nominatim_search(address_parts)
      coords&.merge(status: STATUS_SUCCESS)
    end

    # Tenta geocodificar com apenas cidade + estado
    def geocode_with_city_state
      return nil if @company.city.blank? || @company.state.blank?

      query = "#{@company.city}, #{@company.state}, Brasil"
      coords = nominatim_search(query)
      coords&.merge(status: STATUS_SUCCESS)
    end

    # Fallback: usa centroide da cidade (offline, sem API)
    def geocode_from_centroid
      return nil if @company.city.blank? || @company.state.blank?

      coords = CityCentroidService.coordinates_for(
        state: @company.state,
        city: @company.city
      )
      return nil unless coords

      { lat: coords[:lat], lng: coords[:lng], status: STATUS_CITY_FALLBACK }
    end

    # Consulta a API Nominatim/OSM
    def nominatim_search(query)
      # Rate limiting básico
      sleep(RATE_LIMIT_SECONDS) if defined?(@@last_request_at) && @@last_request_at &&
                                   (Time.current - @@last_request_at) < RATE_LIMIT_SECONDS

      uri = URI(NOMINATIM_URL)
      uri.query = URI.encode_www_form(
        q: query,
        format: 'json',
        limit: 1,
        countrycodes: 'br'
      )

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 10

      request = Net::HTTP::Get.new(uri)
      request['User-Agent'] = USER_AGENT
      request['Accept-Language'] = 'pt-BR'

      response = http.request(request)
      @@last_request_at = Time.current

      return nil unless response.is_a?(Net::HTTPSuccess)

      results = JSON.parse(response.body)
      return nil if results.empty?

      first = results.first
      { lat: first['lat'].to_f, lng: first['lon'].to_f }
    rescue Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.warn "[Geo] Nominatim timeout para query '#{query}': #{e.message}"
      nil
    rescue StandardError => e
      Rails.logger.warn "[Geo] Nominatim erro para query '#{query}': #{e.message}"
      nil
    end
  end
end
