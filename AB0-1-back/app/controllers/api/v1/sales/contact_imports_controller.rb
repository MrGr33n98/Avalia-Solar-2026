# frozen_string_literal: true

module Api
  module V1
    module Sales
      class ContactImportsController < BaseController
        before_action :authenticate_api_user
        before_action :set_import, only: %i[show mapping commit cancel]

        def index
          scope = policy_scope(::Sales::ContactImport).order(created_at: :desc)
          page = [params.fetch(:page, 1).to_i, 1].max
          per_page = [[params.fetch(:per_page, 20).to_i, 1].max, 100].min
          total_count = scope.count
          imports = scope.offset((page - 1) * per_page).limit(per_page)

          render json: {
            contact_imports: imports.map { |i| serialize_import(i) },
            meta: { page: page, per_page: per_page, total_count: total_count, total_pages: (total_count.to_f / per_page).ceil }
          }
        end

        def show
          authorize @import
          render json: { contact_import: serialize_import(@import) }
        end

        def create
          company = current_company
          unless company
            render json: {
              error: 'UNAUTHORIZED_COMPANY',
              message: 'Empresa não autorizada.',
              details: { blockers: [{ code: 'UNAUTHORIZED_COMPANY', message: 'Empresa não autorizada.' }] }
            }, status: :forbidden
            return
          end

          uploaded_file = params[:file]
          file_content = params[:file_content]
          raw_filename = params[:filename] || uploaded_file&.original_filename || 'import.csv'
          clean_filename = File.basename(raw_filename.to_s).gsub(/[^a-zA-Z0-9_.-]/, '_')

          unless clean_filename.downcase.end_with?('.csv')
            render json: {
              error: 'UNSUPPORTED_FORMAT',
              message: 'Apenas arquivos com extensão .csv são permitidos.',
              details: { blockers: [{ code: 'UNSUPPORTED_FORMAT', message: 'Formato não suportado. Envie um arquivo CSV.' }] }
            }, status: :unprocessable_entity
            return
          end

          import = ::Sales::ContactImport.new(
            company_id: company.id,
            user_id: current_user.id,
            filename: clean_filename,
            status: 'uploaded',
            options_jsonb: {}
          )
          authorize import

          if uploaded_file
            if uploaded_file.size > 10.megabytes
              render json: {
                error: 'FILE_TOO_LARGE',
                message: 'O tamanho do arquivo excede o limite máximo de 10MB.',
                details: { blockers: [{ code: 'FILE_TOO_LARGE', message: 'Arquivo maior que 10MB.' }] }
              }, status: :unprocessable_entity
              return
            end
            import.file.attach(uploaded_file)
          elsif file_content.present?
            if file_content.bytesize > 10.megabytes
              render json: {
                error: 'FILE_TOO_LARGE',
                message: 'O conteúdo excede o limite máximo de 10MB.',
                details: { blockers: [{ code: 'FILE_TOO_LARGE', message: 'Arquivo maior que 10MB.' }] }
              }, status: :unprocessable_entity
              return
            end
            import.file.attach(
              io: StringIO.new(file_content),
              filename: clean_filename,
              content_type: 'text/csv'
            )
          else
            render json: {
              error: 'MISSING_FILE',
              message: 'Envie um arquivo CSV válido.',
              details: { blockers: [{ code: 'MISSING_FILE', message: 'Nenhum arquivo enviado.' }] }
            }, status: :unprocessable_entity
            return
          end

          import.save!

          content = import.file.download
          suggested_mapping = ::Sales::Contacts::ImportService.new(import: import).suggest_mapping_from_content(content)
          import.update!(mapping_jsonb: suggested_mapping, status: 'ready')

          render json: { contact_import: serialize_import(import), suggested_mapping: suggested_mapping }, status: :created
        rescue StandardError => e
          render json: {
            error: 'UPLOAD_FAILED',
            message: e.message,
            details: { blockers: [{ code: 'UPLOAD_FAILED', message: e.message }] }
          }, status: :unprocessable_entity
        end

        def mapping
          authorize @import
          mapping_json = params[:mapping] || {}
          options_json = params[:options] || {}

          merged_options = (@import.options_jsonb || {}).merge(options_json.to_h)
          @import.update!(
            mapping_jsonb: mapping_json.to_h,
            options_jsonb: merged_options,
            status: 'ready'
          )

          render json: { contact_import: serialize_import(@import) }
        end

        def commit
          authorize @import
          @import.with_lock do
            unless %w[ready uploaded].include?(@import.status)
              render json: {
                error: 'INVALID_STATUS',
                message: "Importação no estado '#{@import.status}' não pode ser iniciada.",
                details: { blockers: [{ code: 'INVALID_STATUS', message: "Estado '#{@import.status}' inválido." }] }
              }, status: :unprocessable_entity
              return
            end

            @import.update!(status: 'validating')
            ::Sales::ContactImportJob.perform_later(@import.id)

            render json: { contact_import: serialize_import(@import), message: 'Importação enviada para processamento.' }
          end
        end

        def cancel
          authorize @import
          @import.with_lock do
            @import.update!(status: 'cancelled')
          end
          render json: { contact_import: serialize_import(@import) }
        end

        private

        def set_import
          @import = policy_scope(::Sales::ContactImport).find(params[:id])
        end

        def current_company
          return current_user.company if current_user.respond_to?(:company) && current_user.company
          return ::Company.find_by(id: current_user.company_id) if current_user.respond_to?(:company_id) && current_user.company_id.present?

          nil
        end

        def serialize_import(i)
          {
            id: i.id,
            filename: i.filename,
            status: i.status,
            file_attached: i.file.attached?,
            total_rows: i.total_rows,
            valid_rows: i.valid_rows,
            invalid_rows: i.invalid_rows,
            duplicate_rows: i.duplicate_rows,
            imported_rows: i.imported_rows,
            failed_rows: i.failed_rows,
            mapping: i.mapping_jsonb,
            options: i.options_jsonb,
            error_summary: i.error_summary_jsonb,
            started_at: i.started_at,
            completed_at: i.completed_at,
            created_at: i.created_at,
            updated_at: i.updated_at
          }
        end
      end
    end
  end
end
