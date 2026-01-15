module Api
  module V1
    class PaymentsWebhooksController < ActionController::API
      # Webhooks should not require user auth
      def create
        provider = params[:provider].to_s
        status = params[:status].to_s
        checkout_session_id = params[:checkout_session_id].to_s
        payment_reference = params[:payment_reference].to_s

        sub = ::BannerSubscription.find_by(checkout_session_id: checkout_session_id)
        return render json: { error: 'subscription_not_found' }, status: :not_found if sub.nil?

        sub.update!(provider: provider) if provider.present?
        sub.update!(payment_reference: payment_reference) if payment_reference.present?

        case status
        when 'paid', 'succeeded', 'success'
          ends_at = sub.starts_at ? (sub.starts_at + sub.banner_offer.duration_days.days) : (Time.current + sub.banner_offer.duration_days.days)
          sub.activate!(starts_at: Time.current, ends_at: ends_at)
          render json: { ok: true }
        when 'failed'
          sub.update!(status: 'failed', failure_reason: params[:failure_reason].to_s.presence)
          render json: { ok: true }
        else
          render json: { ok: true, ignored: true }
        end
      end
    end
  end
end
