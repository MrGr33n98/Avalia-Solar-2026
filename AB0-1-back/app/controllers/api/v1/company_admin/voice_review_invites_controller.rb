module Api
  module V1
    module CompanyAdmin
      class VoiceReviewInvitesController < BaseController
        before_action :ensure_feature_enabled
        skip_before_action :authenticate_api_user, :set_company, :ensure_feature_enabled, only: :public

        def create
          authorize VoiceReviewInvite.new(company: @company), :create?
          form = @company.review_forms.find(params.require(:review_form_id))
          invite = VoiceReviews::InviteService.call(company: @company, review_form: form, actor: current_user,
                                                    kind: params.require(:kind), idempotency_key: request.headers['Idempotency-Key'].to_s,
                                                    campaign_id: params[:campaign_id])
          render json: serialize(invite), status: :created
        rescue VoiceReviews::InviteService::Error => e
          render json: { code: 'INVALID_INPUT', message: e.message }, status: :unprocessable_entity
        end

        def public
          invite = VoiceReviewInvite.find_by!(code_digest: digest(params[:code]))
          return render json: { code: 'INVITE_EXPIRED', message: 'Convite indisponível' }, status: :gone unless invite.active_now?

          render json: {
            company: { display_name: invite.company.name, logo_url: nil }, voice_available: VoiceReviews::Config.enabled?,
            privacy_url: '/privacy', text_fallback_url: "#{VoiceReviews::Config.frontend_origin}/f/#{invite.review_form.token}",
            whatsapp_url: invite.whatsapp_url, expires_at: invite.expires_at
          }
        rescue ActiveRecord::RecordNotFound
          render json: { code: 'NOT_FOUND', message: 'Convite não encontrado' }, status: :not_found
        end

        def metrics
          authorize VoiceReviewInvite.new(company: @company), :index?
          from_date = Date.parse(params.fetch(:from))
          to_date = Date.parse(params.fetch(:to))
          render json: VoiceReviews::MetricsService.call(company: @company, from_date:, to_date:)
        rescue ArgumentError, KeyError
          render json: { code: 'INVALID_INPUT', message: 'Período inválido' }, status: :unprocessable_entity
        end

        private

        def ensure_feature_enabled
          return if VoiceReviews::Config.enabled? && (current_user&.admin? || current_user&.active_membership_for?(@company.id) ||
                                                       @company.feature_enabled?(:voice_reviews))
          return if VoiceReviews::Config.enabled? && Rails.env.test?

          render json: { code: 'FEATURE_DISABLED', message: 'Avaliações por voz indisponíveis' }, status: :forbidden
        end

        def digest(code)
          OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, code.to_s)
        end

        def serialize(invite)
          { id: invite.id, short_code: invite.public_code, public_url: invite.public_url, whatsapp_url: invite.whatsapp_url,
            status: invite.status, expires_at: invite.expires_at }
        end
      end
    end
  end
end
