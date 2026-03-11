module Api
  module V1
    class GatedDownloadsController < BaseController
      before_action :authenticate_api_user, only: []

      # POST /api/v1/gated_downloads
      def create
        download = GatedDownload.new(download_params)
        download.user ||= find_or_create_contact_user!(download)

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
        source = params[:gated_download].presence || params
        ActionController::Parameters.new(source).permit(
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

      def find_or_create_contact_user!(download)
        return if download.user_id.present?
        return if download.contact_email.blank?

        existing_user = User.find_by(email: download.contact_email.to_s.downcase)
        return existing_user if existing_user.present?

        generated_user = User.new(
          email: download.contact_email,
          name: normalized_contact_name(download.contact_name),
          city: 'Sao Paulo',
          state: 'SP',
          role: 'review',
          status: :active,
          password: "Aa1#{SecureRandom.base64(18)}",
          terms_accepted: true
        )
        generated_user.skip_confirmation! if generated_user.respond_to?(:skip_confirmation!)
        generated_user.save!
        generated_user
      end

      def normalized_contact_name(name)
        value = name.to_s.strip
        return value if value.length >= 3

        "Lead #{SecureRandom.hex(4)}"
      end
    end
  end
end
