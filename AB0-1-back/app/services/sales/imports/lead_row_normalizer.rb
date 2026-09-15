# frozen_string_literal: true

module Sales
  module Imports
    class LeadRowNormalizer
      def self.call(row_hash, mapping)
        new(row_hash, mapping).normalize
      end

      def initialize(row_hash, mapping)
        @row_hash = row_hash || {}
        @mapping = mapping || {}
      end

      def normalize
        dto_attrs = {}

        @mapping.each do |csv_header, canonical_key|
          next if is_blank?(canonical_key)

          raw_val = @row_hash[csv_header].to_s.strip
          next if is_blank?(raw_val)

          case canonical_key.to_sym
          when :email
            dto_attrs[:email] = raw_val.downcase
          when :phone
            dto_attrs[:phone] = normalize_phone(raw_val)
          when :whatsapp
            dto_attrs[:whatsapp] = normalize_phone(raw_val)
          when :state
            dto_attrs[:state] = normalize_state(raw_val)
          when :website
            dto_attrs[:website] = normalize_url(raw_val)
          when :tags
            dto_attrs[:tags] = normalize_tags(raw_val)
          when :estimated_value
            dto_attrs[:estimated_value] = normalize_number(raw_val)
          else
            dto_attrs[canonical_key.to_sym] = raw_val
          end
        end

        LeadRowDto.new(dto_attrs)
      end

      private

      def is_blank?(val)
        val.nil? || (val.respond_to?(:empty?) ? val.empty? : false) || val.to_s.strip.empty?
      end

      def normalize_phone(val)
        digits = val.gsub(/\D/, '')
        return nil if is_blank?(digits)

        if digits.length == 10 || digits.length == 11
          "+55#{digits}"
        elsif digits.start_with?('55') && (digits.length == 12 || digits.length == 13)
          "+#{digits}"
        else
          "+#{digits}"
        end
      end

      def normalize_state(val)
        clean = val.strip.upcase
        return clean if clean.length == 2

        states_map = {
          'ACRE' => 'AC', 'ALAGOAS' => 'AL', 'AMAPÁ' => 'AP', 'AMAPA' => 'AP',
          'AMAZONAS' => 'AM', 'BAHIA' => 'BA', 'CEARÁ' => 'CE', 'CEARA' => 'CE',
          'DISTRITO FEDERAL' => 'DF', 'ESPÍRITO SANTO' => 'ES', 'ESPIRITO SANTO' => 'ES',
          'GOIÁS' => 'GO', 'GOIAS' => 'GO', 'MARANHÃO' => 'MA', 'MARANHAO' => 'MA',
          'MATO GROSSO' => 'MT', 'MATO GROSSO DO SUL' => 'MS', 'MINAS GERAIS' => 'MG',
          'PARÁ' => 'PA', 'PARA' => 'PA', 'PARAÍBA' => 'PB', 'PARAIBA' => 'PB',
          'PARANÁ' => 'PR', 'PARANA' => 'PR', 'PERNAMBUCO' => 'PE', 'PIAUÍ' => 'PI',
          'RIO DE JANEIRO' => 'RJ', 'RIO GRANDE DO NORTE' => 'RN',
          'RIO GRANDE DO SUL' => 'RS', 'RONDÔNIA' => 'RO', 'RONDONIA' => 'RO',
          'RORAIMA' => 'RR', 'SANTA CATARINA' => 'SC', 'SÃO PAULO' => 'SP',
          'SAO PAULO' => 'SP', 'SERGIPE' => 'SE', 'TOCANTINS' => 'TO'
        }

        states_map[clean] || clean[0..1]
      end

      def normalize_url(val)
        return nil if is_blank?(val)
        return val if val.start_with?('http://', 'https://')

        "https://#{val}"
      end

      def normalize_tags(val)
        val.split(/[,;|]/).map(&:strip).reject { |t| is_blank?(t) }.uniq
      end

      def normalize_number(val)
        clean = val.gsub(/[^0-9,.]/, '').tr(',', '.')
        Float(clean)
      rescue ArgumentError, TypeError
        nil
      end
    end
  end
end
