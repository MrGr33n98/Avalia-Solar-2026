# frozen_string_literal: true

require 'csv'

module Api
  module V1
    module Sales
      class ImportsController < BaseController
        before_action :set_import, only: %i[show analyze mapping validate commit rows errors_csv cancel]

        def index
          scope = ::Sales::ImportPolicy::Scope.new(current_user, ::Sales::Import).resolve
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
          company = current_company
          unless company
            render json: { error: { message: 'Empresa não identificada ou não autorizada para o usuário' } }, status: :forbidden
            return
          end

          authorize ::Sales::Import, policy_class: ::Sales::ImportPolicy

          file = params[:file]
          filename = params[:filename] || file&.original_filename || 'import.csv'
          entity_type = params[:entity_type] || 'lead'

          raw_options = params[:options]
          options_hash = if raw_options.respond_to?(:to_unsafe_h)
                           raw_options.to_unsafe_h
                         elsif raw_options.is_a?(Hash)
                           raw_options
                         else
                           { 'duplicate_strategy' => 'update_blank_fields_only' }
                         end

          import = ::Sales::Import.new(
            company_id: company.id,
            user_id: current_user.id,
            entity_type: entity_type,
            filename: filename,
            status: 'uploaded',
            options: options_hash
          )

          if import.save
            if file.present?
              begin
                import.file.attach(file)
              rescue StandardError => e
                Rails.logger.error("[ImportsController#create] Attach error: #{e.message}")
              end
            end

            if (import.file.attached? rescue false)
              begin
                ::Sales::AnalyzeImportJob.perform_now(import.id)
                import.reload
              rescue StandardError => e
                Rails.logger.error("[ImportsController#create] Analyze error: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
              end
            end

            render json: { import: serialize_import(import) }, status: :created
          else
            render json: { error: { message: import.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        rescue StandardError => e
          Rails.logger.error("[ImportsController#create] Exception: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
          render json: { error: { message: "Falha ao criar importação: #{e.message}" } }, status: :internal_server_error
        end

        def show
          render json: { import: serialize_import(@import) }
        end

        def analyze
          ::Sales::AnalyzeImportJob.perform_now(@import.id)
          @import.reload
          render json: { import: serialize_import(@import) }
        end

        def mapping
          raw_mapping = params[:mapping]
          raw_options = params[:options]

          mapping_hash = if raw_mapping.respond_to?(:to_unsafe_h)
                           raw_mapping.to_unsafe_h
                         elsif raw_mapping.is_a?(Hash)
                           raw_mapping
                         else
                           {}
                         end

          options_hash = if raw_options.respond_to?(:to_unsafe_h)
                           raw_options.to_unsafe_h
                         elsif raw_options.is_a?(Hash)
                           raw_options
                         else
                           {}
                         end

          new_options = (@import.options || {}).merge(options_hash)

          if @import.update(mapping: mapping_hash, options: new_options, status: 'mapping')
            begin
              ::Sales::AnalyzeImportJob.perform_now(@import.id)
              @import.reload
            rescue StandardError => e
              Rails.logger.error("[ImportsController#mapping] Analyze error: #{e.message}")
            end
            render json: { import: serialize_import(@import) }
          else
            render json: { error: { message: @import.errors.full_messages.join(', ') } }, status: :unprocessable_entity
          end
        rescue StandardError => e
          render json: { error: { message: e.message } }, status: :unprocessable_entity
        end

        def validate
          ::Sales::AnalyzeImportJob.perform_later(@import.id)
          render json: { import: serialize_import(@import), message: 'Validação iniciada' }
        end

        def commit
          if @import.status_processing? || @import.status_completed?
            return render json: { error: { message: 'Importação já está em processamento ou concluída' } }, status: :unprocessable_entity
          end

          @import.update!(status: 'queued')
          ::Sales::ProcessImportJob.perform_later(@import.id)

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
          @import = ::Sales::ImportPolicy::Scope.new(current_user, ::Sales::Import).resolve.find(params[:id])
          authorize @import, policy_class: ::Sales::ImportPolicy
        end

        def current_company
          return current_user.company if current_user.respond_to?(:company) && current_user.company
          return ::Company.find_by(id: current_user.company_id) if current_user.respond_to?(:company_id) && current_user.company_id.present?
          return ::Company.first if current_user.respond_to?(:admin?) && current_user.admin?

          nil
        end

        def serialize_import(imp)
          first_row_keys = imp.rows.first&.raw_data&.keys || []
          mapping_keys = imp.mapping.respond_to?(:keys) ? imp.mapping.keys : []
          headers = (first_row_keys.presence || mapping_keys).map(&:to_s)

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
            headers: headers,
            options: imp.options,
            error_summary: imp.error_summary,
            started_at: imp.started_at,
            completed_at: imp.completed_at,
            created_at: imp.created_at,
            file_attached: (imp.file.attached? rescue false)
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
