# frozen_string_literal: true

require 'csv'

module Sales
  module Imports
    class CsvParser
      def self.call(file_or_content)
        new(file_or_content).parse
      end

      def initialize(file_or_content)
        @content = extract_content(file_or_content)
      end

      def parse
        return { headers: [], rows: [], error: 'Conteúdo do arquivo está vazio' } if @content.blank?

        sanitized_content = remove_bom(@content)
        delimiter = detect_delimiter(sanitized_content)

        options = {
          col_sep: delimiter,
          headers: true,
          skip_blanks: true,
          quote_char: '"'
        }

        parsed_csv = CSV.parse(sanitized_content, **options)
        headers = parsed_csv.headers.compact.map(&:to_s).map(&:strip)

        rows = []
        parsed_csv.each_with_index do |row, idx|
          row_hash = row.to_h.transform_keys { |k| k.to_s.strip }
          rows << { row_number: idx + 1, data: row_hash }
        end

        { headers: headers, rows: rows, delimiter: delimiter }
      rescue StandardError => e
        { headers: [], rows: [], error: "Erro ao ler CSV: #{e.message}" }
      end

      private

      def extract_content(file_or_content)
        if file_or_content.respond_to?(:read)
          file_or_content.read.force_encoding('UTF-8').encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        else
          file_or_content.to_s.force_encoding('UTF-8').encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        end
      end

      def remove_bom(text)
        text.sub(/\A\xEF\xBB\xBF/, '')
      end

      def detect_delimiter(text)
        first_line = text.lines.first.to_s
        comma_count = first_line.count(',')
        semicolon_count = first_line.count(';')
        tab_count = first_line.count("\t")

        if semicolon_count > comma_count && semicolon_count >= tab_count
          ';'
        elsif tab_count > comma_count && tab_count > semicolon_count
          "\t"
        else
          ','
        end
      end
    end
  end
end
