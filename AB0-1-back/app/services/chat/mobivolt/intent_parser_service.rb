# frozen_string_literal: true

module Chat
  module Mobivolt
    class IntentParserService
      RECOMMENDATION_KEYWORDS = %w[
        recomenda indica melhor quais quem empresa instalador
        onde encontrar contratar opções parceiros recomendacao indicacao
      ].freeze
      CATEGORY_PATTERNS = {
        'integracao-solar-ev' => /(?:solar.+(?:recarga|carregador)|(?:recarga|carregador).+solar)/,
        'carregadores-residenciais' => /(?:wallbox|carregador.+residencial|residencia.+carregador)/,
        'carregadores-comerciais' => /(?:condominio|frota|empresa.+carregador|carregador.+comercial)/,
        'estacoes-publicas' => /(?:eletroposto|estacao.+recarga|recarga.+publica)/,
        'financiamento-energia-solar' => /(?:financiamento|financiar|parcelas?).+solar|solar.+(?:financiamento|financiar|parcelas?)/,
        'energia-solar-residencial' => /(?:solar.+residencial|residencial.+solar)/,
        'energia-solar-comercial-industrial' => /(?:solar.+(?:comercial|industrial)|(?:comercial|industrial).+solar)/,
        'energia-solar-rural' => /(?:solar.+(?:rural|agronegocio)|(?:rural|agronegocio).+solar)/,
        'mobilidade-eletrica' => /(?:mobilidade.+eletrica|veiculo.+eletrico)/,
        'energia-solar' => /(?:energia.+solar|solar)/
      }.freeze

      def self.parse(user_text)
        new(user_text).parse
      end

      def initialize(user_text)
        @original_text = user_text.to_s
        @clean_text = clean_text(@original_text)
      end

      def parse
        intent = detect_recommendation_intent
        state = detect_state
        city = detect_city(state)
        keyword = detect_keyword
        category_seo_url = detect_category

        {
          recommendation_intent: intent || state.present? || city.present? || keyword.present?,
          city: city,
          state: state,
          keyword: keyword,
          category_seo_url: category_seo_url
        }
      end

      private

      def clean_text(text)
        cleaned = ActiveSupport::Inflector.transliterate(text).downcase
        cleaned.gsub(/[^\w\s]/, ' ')
      end

      def detect_recommendation_intent
        words = @clean_text.split(/\s+/)
        (words & RECOMMENDATION_KEYWORDS).any?
      end

      def detect_state
        # Busca por UFs com 2 letras no clean_text
        states = Locations::BrLocations.states.map { |s| s['acronym'].downcase }
        words = @clean_text.split(/\s+/)
        matched = words.find { |w| states.include?(w) }
        matched&.upcase
      end

      def detect_city(detected_state = nil)
        states_to_search = if detected_state.present?
                             [detected_state]
                           else
                             Locations::BrLocations.states.map { |s| s['acronym'] }
                           end

        states_to_search.each do |uf|
          cities = Locations::BrLocations.cities_for(uf)
          cities.each do |city_name|
            normalized_city = clean_text(city_name)
            # Evita matches curtos vazios ou comuns e busca match exato na borda da palavra
            if normalized_city.length > 3 && @clean_text.match?(/\b#{Regexp.escape(normalized_city)}\b/)
              return city_name
            end
          end
        end

        nil
      end

      def detect_keyword
        # Busca por marcas e serviços de interesse
        brands = %w[weg intelbras dahua byd fronius sungrow growatt resun phb canadian jinko trina]
        services = %w[carregador wallbox eletroposto manutencao limpeza instalacao inversor bateria solar eolica]

        words = @clean_text.split(/\s+/)
        
        matched_brand = words.find { |w| brands.include?(w) }
        return matched_brand.capitalize if matched_brand

        matched_service = words.find { |w| services.include?(w) }
        return matched_service if matched_service

        (brands + services).each do |term|
          if @clean_text.match?(/\b#{Regexp.escape(term)}[a-z]*\b/)
            return term.capitalize if brands.include?(term)
            return term
          end
        end

        nil
      end

      def detect_category
        CATEGORY_PATTERNS.each do |category_seo_url, pattern|
          return category_seo_url if @clean_text.match?(pattern)
        end

        nil
      end
    end
  end
end
