# frozen_string_literal: true

module Api
  module V1
    class ReviewUploadsController < BaseController
      before_action :authenticate_api_user
      before_action :set_session, only: %i[show media destroy_media]

      def create
        session = current_user.review_upload_sessions.create!(
          status: :active,
          expires_at: ReviewUploadSession::EXPIRATION.from_now
        )
        render json: session_payload(session), status: :created
      end

      def show
        render json: session_payload(@session)
      end

      def media
        media = ReviewUploadMediaService.new(
          session: @session,
          user: current_user,
          upload: params[:file],
          sort_order: params[:sort_order]
        ).call
        render json: media_payload(media), status: :created
      rescue ReviewUploadMediaService::UploadError => e
        render_error_response(message: e.message, status: :unprocessable_entity, code: 'REVIEW_MEDIA_INVALID')
      rescue StandardError => e
        Rails.logger.error("[ReviewUploads] upload failed: #{e.class}: #{e.message}")
        render_error_response(message: 'Não foi possível enviar esta foto.', status: :internal_server_error, code: 'REVIEW_MEDIA_UPLOAD_FAILED')
      end

      def destroy_media
        media = @session.review_media.find(params[:media_id])
        media.file.purge_later if media.file.attached?
        media.destroy!
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render_error_response(message: 'Mídia não encontrada.', status: :not_found, code: 'REVIEW_MEDIA_NOT_FOUND')
      end

      private

      def set_session
        @session = current_user.review_upload_sessions.find_by!(uuid: params[:uuid])
      rescue ActiveRecord::RecordNotFound
        render_error_response(message: 'Sessão de upload não encontrada.', status: :not_found, code: 'REVIEW_UPLOAD_SESSION_NOT_FOUND')
      end

      def session_payload(session)
        {
          id: session.uuid,
          status: session.status,
          expires_at: session.expires_at,
          media: session.review_media.ordered.map { |media| media_payload(media) }
        }
      end

      def media_payload(media)
        {
          id: media.id,
          type: media.media_type,
          status: media.status,
          moderation_status: media.moderation_status,
          sort_order: media.sort_order,
          width: media.width,
          height: media.height
        }
      end
    end
  end
end