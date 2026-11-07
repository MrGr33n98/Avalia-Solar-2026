module Api
  module V1
    class VoiceReviewsController < BaseController
      skip_before_action :capture_edge_location, only: %i[webhook webhook_waha]

      def webhook_verify
        return render plain: params['hub.challenge'] if ActiveSupport::SecurityUtils.secure_compare(
          params['hub.verify_token'].to_s, VoiceReviews::Config.meta_verify_token.to_s
        ) && params['hub.mode'].to_s == 'subscribe' && VoiceReviews::Config.meta_verify_token.present?

        head :forbidden
      end

      def webhook
        return render json: { code: 'FEATURE_DISABLED', message: 'Avaliações por voz indisponíveis' }, status: :service_unavailable unless VoiceReviews::Config.enabled?

        VoiceReviews::WebhookIngestor.call(raw_body: request.raw_post, signature: request.headers['X-Hub-Signature-256'])
        render json: { received: true }
      rescue VoiceReviews::WebhookIngestor::InvalidSignature
        render json: { code: 'INVALID_SIGNATURE', message: 'Assinatura inválida' }, status: :forbidden
      rescue VoiceReviews::WebhookIngestor::InvalidEnvelope
        render json: { code: 'INVALID_ENVELOPE', message: 'Envelope inválido' }, status: :bad_request
      end

      def webhook_waha
        return render json: { code: 'FEATURE_DISABLED', message: 'Avaliações por voz indisponíveis' }, status: :service_unavailable unless VoiceReviews::Config.enabled?

        VoiceReviews::WahaWebhookIngestor.call(
          raw_body: request.raw_post,
          signature: request.headers['X-Webhook-Hmac'],
          timestamp: request.headers['X-Webhook-Timestamp'],
          algorithm: request.headers['X-Webhook-Hmac-Algorithm']
        )
        render json: { received: true }
      rescue VoiceReviews::WahaWebhookIngestor::InvalidSignature
        render json: { code: 'INVALID_SIGNATURE', message: 'Assinatura inválida' }, status: :forbidden
      rescue VoiceReviews::WahaWebhookIngestor::InvalidEnvelope
        render json: { code: 'INVALID_ENVELOPE', message: 'Envelope inválido' }, status: :bad_request
      end

      def show
        return render json: { code: 'FEATURE_DISABLED', message: 'Avaliações por voz indisponíveis' }, status: :service_unavailable unless VoiceReviews::Config.enabled?

        session = VoiceReviewSession.find(params[:id])
        authenticate_session!(session)
        transcript = session.latest_transcript
        render json: { session_id: session.id, company_name: session.company.name, state: session.state,
                       transcript_text: transcript&.text, transcript_version: transcript&.version || 0,
                       publication_consent_required: true, privacy_url: '/privacy' }
      rescue VoiceReviews::ConfirmationService::Error
        render json: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada' }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound
        render json: { code: 'NOT_FOUND', message: 'Sessão não encontrada' }, status: :not_found
      end

      def confirm
        return render json: { code: 'FEATURE_DISABLED', message: 'Avaliações por voz indisponíveis' }, status: :service_unavailable unless VoiceReviews::Config.enabled?

        session = VoiceReviewSession.find(params[:id])
        result = VoiceReviews::ConfirmationService.call(session:, token: bearer_token, params: confirmation_params)
        render json: result, status: :created
      rescue VoiceReviews::ConfirmationService::Error => e
        render json: { code: 'INVALID_CONFIRMATION', message: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordNotFound
        render json: { code: 'NOT_FOUND', message: 'Sessão não encontrada' }, status: :not_found
      end

      private

      def bearer_token
        request.headers['Authorization'].to_s.sub(/\ABearer\s+/i, '')
      end

      def authenticate_session!(session)
        raise VoiceReviews::ConfirmationService::Error unless session.token_matches?(bearer_token) && session.active_now?
      end

      def confirmation_params
        source = params[:confirmation] || params
        source.permit(:transcript_version, :review_text, :rating, :experience_confirmed,
                      :publish_text_consent, :display_name_mode, :full_name_consent, acknowledgements: {})
      end
    end
  end
end
