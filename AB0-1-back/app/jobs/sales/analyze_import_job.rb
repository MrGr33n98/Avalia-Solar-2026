# frozen_string_literal: true

module Sales
  class AnalyzeImportJob < ApplicationJob
    queue_as :default

    def perform(import_id)
      import = ::Sales::Import.find_by(id: import_id)
      return if import.nil? || import.status_cancelled?

      import.update!(status: 'validating')

      unless import.file.attached?
        import.update!(status: 'failed', error_summary: { error: 'Nenhum arquivo anexado' })
        return
      end

      file_content = import.file.download
      parse_result = ::Sales::Imports::CsvParser.call(file_content)

      if parse_result[:error].present?
        import.update!(status: 'failed', error_summary: { error: parse_result[:error] })
        return
      end

      headers = parse_result[:headers]
      rows_data = parse_result[:rows]

      # Persistir os headers originais do CSV para o wizard usar corretamente
      csv_headers_to_save = headers

      # Usar o mapeamento já definido pelo usuário (Step 2) se existir,
      # caso contrário sugerir automaticamente a partir dos headers do CSV.
      suggested_mapping = ::Sales::Imports::HeaderMapper.call(headers)
      current_mapping = import.mapping.presence || suggested_mapping

      # Limpar rows antigas se re-analisando
      import.rows.delete_all

      total = rows_data.length
      valid_count = 0
      invalid_count = 0
      dup_count = 0

      import_rows_build = []

      rows_data.each do |r|
        dto = ::Sales::Imports::LeadRowNormalizer.call(r[:data], current_mapping)
        val_res = ::Sales::Imports::LeadRowValidator.call(dto, company: import.company)
        dup_res = ::Sales::Imports::LeadDuplicateDetector.call(dto, company: import.company)

        status = if !val_res[:valid]
                   invalid_count += 1
                   'invalid'
                 elsif dup_res.present?
                   dup_count += 1
                   'duplicate'
                 else
                   valid_count += 1
                   'valid'
                 end

        import_rows_build << {
          sales_import_id: import.id,
          row_number: r[:row_number],
          raw_data: r[:data],
          normalized_data: dto.to_h,
          status: status,
          errors_json: val_res[:errors],
          warnings_json: val_res[:warnings],
          duplicate_type: dup_res&.dig(:duplicate_type),
          duplicate_record_type: dup_res&.dig(:record)&.class&.name,
          duplicate_record_id: dup_res&.dig(:record)&.id,
          created_at: Time.current,
          updated_at: Time.current
        }
      end

      # Bulk insert de linhas para análise rápida
      ::Sales::ImportRow.insert_all!(import_rows_build) if import_rows_build.any?

      import.update!(
        status: 'ready',
        mapping: current_mapping,
        csv_headers: csv_headers_to_save,
        total_rows: total,
        valid_rows: valid_count,
        invalid_rows: invalid_count,
        duplicate_rows: dup_count
      )
    rescue StandardError => e
      Rails.logger.error("[AnalyzeImportJob] Error: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
      import&.update!(status: 'failed', error_summary: { error: e.message })
    end
  end
end
