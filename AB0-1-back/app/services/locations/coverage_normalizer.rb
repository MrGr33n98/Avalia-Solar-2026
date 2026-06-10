# frozen_string_literal: true

module Locations
  class CoverageNormalizer
    BRAZIL_CAPITALS = [
      { state: 'AC', city: 'Rio Branco' },
      { state: 'AL', city: 'Maceió' },
      { state: 'AP', city: 'Macapá' },
      { state: 'AM', city: 'Manaus' },
      { state: 'BA', city: 'Salvador' },
      { state: 'CE', city: 'Fortaleza' },
      { state: 'DF', city: 'Brasília' },
      { state: 'ES', city: 'Vitória' },
      { state: 'GO', city: 'Goiânia' },
      { state: 'MA', city: 'São Luís' },
      { state: 'MT', city: 'Cuiabá' },
      { state: 'MS', city: 'Campo Grande' },
      { state: 'MG', city: 'Belo Horizonte' },
      { state: 'PA', city: 'Belém' },
      { state: 'PB', city: 'João Pessoa' },
      { state: 'PR', city: 'Curitiba' },
      { state: 'PE', city: 'Recife' },
      { state: 'PI', city: 'Teresina' },
      { state: 'RJ', city: 'Rio de Janeiro' },
      { state: 'RN', city: 'Natal' },
      { state: 'RS', city: 'Porto Alegre' },
      { state: 'RO', city: 'Porto Velho' },
      { state: 'RR', city: 'Boa Vista' },
      { state: 'SC', city: 'Florianópolis' },
      { state: 'SP', city: 'São Paulo' },
      { state: 'SE', city: 'Aracaju' },
      { state: 'TO', city: 'Palmas' }
    ].freeze

    class << self
      def normalize_state(value)
        state = value.to_s.strip.upcase
        return nil if state.blank?
        return state if Locations::BrLocations.valid_state?(state)

        nil
      end

      def normalize_states(value)
        tokens(value).filter_map { |token| normalize_state(token) }.uniq
      end

      def unrecognized_states(value)
        tokens(value).reject { |token| normalize_state(token).present? }.uniq
      end

      def canonical_state_text(value, preserve_unknown: true)
        states = normalize_states(value)
        states += unrecognized_states(value) if preserve_unknown
        states.uniq.join(', ')
      end

      def normalize_city(value, state: nil)
        cleaned = clean_text(value)
        return nil if cleaned.blank?

        state_code = normalize_state(state)
        if state_code.present?
          return canonical_city_for_state(state_code, cleaned)
        end

        Locations::BrLocations.states.each do |state_hash|
          city = canonical_city_for_state(state_hash['acronym'], cleaned)
          return city if city.present?
        end

        nil
      end

      def normalize_cities(value, state: nil)
        tokens(value).filter_map { |token| normalize_city(token, state: state) }.uniq
      end

      def unrecognized_cities(value, state: nil)
        tokens(value).reject { |token| normalize_city(token, state: state).present? }.uniq
      end

      def canonical_city_text(value, state: nil, preserve_unknown: true)
        cities = normalize_cities(value, state: state)
        cities += unrecognized_cities(value, state: state) if preserve_unknown
        cities.uniq.join(', ')
      end

      def city_slug(value)
        clean_text(value).parameterize
      end

      def state_slug(value)
        normalize_state(value).to_s.downcase
      end

      def resolve_city_slug(state, slug)
        state_code = normalize_state(state)
        return nil if state_code.blank?

        target_slug = slug.to_s.strip.downcase
        Locations::BrLocations.cities_for(state_code).find do |city|
          city_slug(city) == target_slug
        end
      end

      def local_solar_path(state, city)
        state_code = state_slug(state)
        city_path = city_slug(city)
        return nil if state_code.blank? || city_path.blank?

        "/companies/energia-solar/#{state_code}/#{city_path}"
      end

      def capital_for(state)
        state_code = normalize_state(state)
        BRAZIL_CAPITALS.find { |capital| capital[:state] == state_code }
      end

      def capital_city?(state, city)
        capital = capital_for(state)
        return false if capital.blank?

        city_slug(capital[:city]) == city_slug(city)
      end

      def serves_state?(company, state)
        state_code = normalize_state(state)
        return false if state_code.blank? || company.blank?

        return true if normalize_state(company.state) == state_code

        normalize_states(company.coverage_states).include?(state_code)
      end

      def serves_city?(company, city, state: nil)
        canonical_city = normalize_city(city, state: state)
        state_code = normalize_state(state)
        return false if canonical_city.blank? || company.blank?

        base_city_matches = city_slug(company.city) == city_slug(canonical_city)
        base_state_matches = state_code.blank? || normalize_state(company.state) == state_code
        return true if base_city_matches && base_state_matches

        coverage_cities = normalize_cities(company.coverage_cities, state: state_code)
        return true if coverage_cities.any? { |coverage_city| city_slug(coverage_city) == city_slug(canonical_city) } &&
                       (state_code.blank? || serves_state?(company, state_code))

        false
      end

      def tokens(value)
        return [] if value.blank?

        raw =
          if value.is_a?(Array)
            value
          else
            text = value.to_s.strip
            parse_json_array(text) || text.split(/[;,\n\r|]+/)
          end

        Array(raw).map { |item| clean_text(item) }.reject(&:blank?)
      end

      private

      def parse_json_array(text)
        return nil unless text.start_with?('[')

        parsed = JSON.parse(text)
        parsed if parsed.is_a?(Array)
      rescue JSON::ParserError
        nil
      end

      def canonical_city_for_state(state, city)
        target_key = city_key(city)
        return nil if target_key.blank?

        Locations::BrLocations.cities_for(state).find do |candidate|
          city_key(candidate) == target_key
        end
      end

      def clean_text(value)
        value.to_s.strip.gsub(/\s+/, ' ')
      end

      def city_key(value)
        ActiveSupport::Inflector.transliterate(clean_text(value)).downcase
      end
    end
  end
end
