# frozen_string_literal: true

module Api
  module V1
    module Chat
      class AttachmentsController < BaseController
        MAX_FILE_SIZE = 15.megabytes
        ALLOWED_CONTENT_TYPES = %w[
          image/jpeg image/png image/webp image/gif
          application/pdf
          application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document
          application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
          text/plain text/csv
        ].freeze

        before_action :authenticate_api_user
        before_action :set_company

        def create
          byte_size = params.require(:byte_size).to_i
          if byte_size <= 0 || byte_size > MAX_FILE_SIZE
            return render_error_response(message: 'Tamanho de arquivo inválido (máximo 15MB).', status: :unprocessable_entity, code: 'FILE_TOO_LARGE')
          end

          content_type = params.require(:content_type).to_s.downcase
          unless ALLOWED_CONTENT_TYPES.include?(content_type)
            return render_error_response(message: 'Tipo de arquivo não permitido.', status: :unprocessable_entity, code: 'INVALID_FILE_TYPE')
          end

          blob = ActiveStorage::Blob.create_before_direct_upload!(
            filename: params.require(:filename),
            byte_size: byte_size,
            checksum: params[:checksum].presence || 'dummy',
            content_type: content_type
          )

          render json: {
            id: blob.id,
            signed_id: blob.signed_id,
            direct_upload: {
              url: blob.service_url_for_direct_upload,
              headers: blob.service_headers_for_direct_upload
            }
          }
        end

        private

        def set_company
          @company = Company.find(params[:company_id])
          return if current_user.admin? || current_user.active_membership_for?(@company.id)

          render_error_response(
            message: 'Você não possui acesso a esta empresa.',
            status: :forbidden,
            code: 'COMPANY_ACCESS_REQUIRED'
          )
        end
      end
    end
  end
end
