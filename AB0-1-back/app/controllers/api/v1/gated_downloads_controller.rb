module Api
  module V1
    class GatedDownloadsController < BaseController
      before_action :authenticate_api_user, only: []

      # POST /api/v1/gated_downloads
      def create
        download = GatedDownload.new(download_params)
        
        if download.save
          render json: {
            status: 'success',
            user_id: download.user_id,
            anonymous_id: download.anonymous_id,
            message: 'Download registrado com sucesso'
          }, status: :created
        else
          render json: {
            status: 'error',
            errors: download.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      private

      def download_params
        params.require(:gated_download).permit(
          :company_id,
          :user_id,
          :anonymous_id,
          :document_type,
          :document_title,
          :document_url,
          :contact_name,
          :contact_email,
          :contact_phone,
          metadata: {}
        )
      end
    end
  end
end
