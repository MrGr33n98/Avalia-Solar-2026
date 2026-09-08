# frozen_string_literal: true

require 'csv'

module Api
  module V1
    module Sales
      class ImportsController < BaseController
        before_action :set_import, only: %i[show analyze mapping validate commit rows errors_csv cancel]

        def index
          scope = Sales::ImportPolicy::Scope.new(current_user, ::Sales::Import).resolve
          imports = scope.order(created_at: :desc).page(params[:page] || 1).per(params[:per_page] || 20)

          render json: {
            imports: imports.map { |imp| serialize_import(imp) },
            meta: {
              current_page: imports.current_page,
              total_pages: imports.total_pages,
              total_count: imports.total_count
            }
          }
        end

        def create
          authorize ::Sales::Import, policy_class: Sales::ImportPolicy

          file = params[:file]
          filename = params[:filename] || file&.original_filename || 'import.csv'
          entity_type = params[:entity_type] || 'lead'

          import = ::Sales::Import.new(
            company_id: current_user.company_id,
            user_id: current_user.id,
            entity_type: entity_type,
            filename: filename,
            status: 'uploaded',
            options: params[:options] || { duplicate_strategy: 'update_blank_fields_only' }
          )

          if file.present?
            import.file.attach(file)
          end

          if import.save
            # Trigger background analysis
            Sales::AnalyzeImportJob.perform_later(import.id) if import.file.attached?
            render json: { import: serialize_import(import) }, status: :created
          else
            render json: { error: { message: import.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def show
          render json: { import: serialize_import(@import) }
        end

        def analyze
          Sales::AnalyzeImportJob.perform_now(@import.id)
          @import.reload
          render json: { import: serialize_import(@import) }
        end

        def mapping
          mapping_params = params[:mapping] || {}
          opts_hash = options_params.respond_to?(:to_unsafe_h) ? options_params.to_unsafe_h : options_params
          new_options = (@import.options || {}).merge(opts_hash || {})

          if @import.update(mapping: mapping_params, options: new_options, status: 'mapping')
            Sales::AnalyzeImportJob.perform_later(@import.id)
            render json: { import: serialize_import(@import) }
          else
            render json: { error: { message: @import.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        end

        def validate
          Sales::AnalyzeImportJob.perform_later(@import.id)
          render json: { import: serialize_import(@import), message: 'Validação iniciada' }
        end

        def commit
          if @import.status_processing? || @import.status_completed?
            return render json: { error: { message: 'Importação já está em processamento ou concluída' } }, status: :unprocessable_entity
          end

          @import.update!(status: 'queued')
          Sales::ProcessImportJob.perform_later(@import.id)

          render json: { import: serialize_import(@import), message: 'Importação enfileirada com sucesso' }
        end

        def rows
          scope = @import.rows
          scope = scope.where(status: params[:status]) if params[:status].present?

          rows = scope.order(:row_number).page(params[:page] || 1).per(params[:per_page] || 50)

          render json: {
            rows: rows.map { |r| serialize_row(r) },
            meta: {
              current_page: rows.current_page,
              total_pages: rows.total_pages,
              total_count: rows.total_count
            }
          }
        end

        def errors_csv
          failed_rows = @import.rows.where(status: %w[invalid failed])

          csv_data = CSV.generate(col_sep: ';', headers: true) do |csv|
            csv << ['Linha', 'Erros', 'Empresa', 'Contato', 'Email', 'Telefone', 'Dados Brutos (JSON)']

            failed_rows.find_each do |row|
              errs = Array(row.errors_json).join(' | ')
              raw = row.raw_data || {}
              # Escape CSV injection starting formula characters =, +, -, @
              safe_errs = errs.start_with?('=', '+', '-', '@') ? "'#{errs}" : errs

              csv << [
                row.row_number,
                safe_errs,
                raw['empresa'] || raw['company'] || raw['company_name'],
                raw['nome'] || raw['contato'] || raw['contact_name'],
                raw['email'],
                raw['telefone'] || raw['phone'],
                raw.to_json
              ]
            end
          end

          send_data csv_data, filename: "relatorio_erros_import_#{@import.id}.csv", type: 'text/csv; charset=utf-8'
        end

        def cancel
          @import.update!(status: 'cancelled')
          render json: { import: serialize_import(@import), message: 'Importação cancelada' }
        end

        private

        def set_import
          @import = Sales::ImportPolicy::Scope.new(current_user, ::Sales::Import).resolve.find(params[:id])
          authorize @import, policy_class: Sales::ImportPolicy
        end

        def serialize_import(imp)
          {
            id: imp.id,
            company_id: imp.company_id,
            user_id: imp.user_id,
            entity_type: imp.entity_type,
            filename: imp.filename,
            status: imp.status,
            total_rows: imp.total_rows,
            processed_rows: imp.processed_rows,
            valid_rows: imp.valid_rows,
            invalid_rows: imp.invalid_rows,
            duplicate_rows: imp.duplicate_rows,
            created_rows: imp.created_rows,
            updated_rows: imp.updated_rows,
            skipped_rows: imp.skipped_rows,
            mapping: imp.mapping,
            options: imp.options,
            error_summary: imp.error_summary,
            started_at: imp.started_at,
            completed_at: imp.completed_at,
            created_at: imp.created_at,
            file_url: imp.file.attached? ? url_for(imp.file) : nil
          }
        end

        def serialize_row(row)
          {
            id: row.id,
            row_number: row.row_number,
            raw_data: row.raw_data,
            normalized_data: row.normalized_data,
            status: row.status,
            errors: row.errors_json,
            warnings: row.warnings_json,
            duplicate_type: row.duplicate_type,
            duplicate_record_id: row.duplicate_record_id,
            result_record_id: row.result_record_id
          }
        end
      end
    end
  end
end
