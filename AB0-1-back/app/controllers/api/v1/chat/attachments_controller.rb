# frozen_string_literal: true

module Api
  module V1
    module Chat
      class AttachmentsController < BaseController
        before_action :authenticate_api_user!
        before_action :set_company

        def create
          authorize @company, :show?
          blob = ActiveStorage::Blob.create_before_direct_upload!(
            filename: params.require(:filename),
            byte_size: params.require(:byte_size),
            checksum: params[:checksum] || 'dummy',
            content_type: params.require(:content_type)
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
        end
      end
    end
  end
end
