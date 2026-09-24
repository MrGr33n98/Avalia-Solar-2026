# frozen_string_literal: true

require 'csv'

class Territory
  class CsvAuditor
    VALID_UFS = %w[
      AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO
    ].freeze

    attr_reader :csv_path, :report

    def initialize(csv_path: Rails.root.join('db', 'data', 'municipios.csv'))
      @csv_path = csv_path
      @report = {}
    end

    def audit
      raise "CSV not found at #{csv_path}" unless File.exist?(csv_path)

      raw = File.binread(csv_path)
      detected_encoding = raw.dup.force_encoding('UTF-8').valid_encoding? ? 'UTF-8' : 'ISO-8859-1'

      lines_count = 0
      ibge_map = {}
      duplicate_ibge = []
      invalid_ufs = []
      missing_codes = []
      homonyms_map = Hash.new { |h, k| h[k] = [] }
      rows_sample = []

      CSV.foreach(csv_path, headers: true, col_sep: ';', encoding: "#{detected_encoding}:UTF-8") do |row|
        lines_count += 1
        tom_code = row[0]&.strip
        ibge_code = row[1]&.strip
        name_tom = row[2]&.strip
        name_ibge = row[3]&.strip
        uf = row[4]&.strip

        if ibge_code.blank? || ibge_code == '0'
          missing_codes << { row: lines_count, tom_code: tom_code, name: name_tom || name_ibge, uf: uf }
        elsif ibge_map[ibge_code]
          duplicate_ibge << { ibge: ibge_code, name: name_ibge, uf: uf }
        else
          ibge_map[ibge_code] = { name: name_ibge, uf: uf }
        end

        if uf.blank? || !VALID_UFS.include?(uf)
          invalid_ufs << { row: lines_count, uf: uf, name: name_ibge || name_tom }
        elsif name_ibge.present?
          homonyms_map[name_ibge] << uf
        end

        rows_sample << { tom: tom_code, ibge: ibge_code, name: name_ibge, uf: uf } if lines_count <= 3
      end

      homonyms = homonyms_map.select { |_k, v| v.size > 1 }.transform_values(&:uniq)

      @report = {
        csv_path: csv_path.to_s,
        detected_encoding: detected_encoding,
        total_rows: lines_count,
        valid_municipality_count: lines_count - invalid_ufs.size - missing_codes.size,
        unique_ibge_count: ibge_map.size,
        duplicate_ibge_count: duplicate_ibge.size,
        duplicate_ibge_examples: duplicate_ibge.first(5),
        invalid_uf_count: invalid_ufs.size,
        invalid_ufs: invalid_ufs,
        missing_code_count: missing_codes.size,
        missing_codes: missing_codes,
        homonym_names_count: homonyms.size,
        sample_rows: rows_sample,
        audit_passed: duplicate_ibge.empty? && missing_codes.size <= 1
      }
    end
  end
end
