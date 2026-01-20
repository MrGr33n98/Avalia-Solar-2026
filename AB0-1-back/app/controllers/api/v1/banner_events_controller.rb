module Api
  module V1
    class BannerEventsController < Api::V1::BaseController
      skip_before_action :authenticate_api_user, raise: false
      skip_before_action :verify_authenticity_token, raise: false

      def create
        event_params = params.require(:banner_event).permit(:banner_id, :company_id, :event_type, :tracked_at, utm: {}, metadata: {})

        banner_id = event_params[:banner_id]
        event_type = event_params[:event_type].to_s
        company_id = event_params[:company_id]
        tracked_at = event_params[:tracked_at].presence || Time.current

        unless BannerEvent::EVENT_TYPES.include?(event_type)
          return render json: { error: 'invalid_event_type' }, status: :unprocessable_entity
        end

        BannerEvent.create!(
          banner_id: banner_id,
          company_id: company_id,
          event_type: event_type,
          tracked_at: tracked_at,
          ip_hash: safe_hash(request.remote_ip.to_s),
          user_agent_hash: safe_hash(request.user_agent.to_s),
          referrer: request.referer.to_s,
          utm_json: sanitize_json(event_params[:utm]),
          metadata_json: sanitize_json(event_params[:metadata])
        )

        render json: { status: 'ok' }, status: :created
      end

      private

      def sanitize_json(obj)
        return {} unless obj.is_a?(Hash)
        obj.slice(*obj.keys) # ensure simple hash, no unsafe types
      end

      def safe_hash(value)
        return nil if value.blank?
        require 'digest'
        Digest::SHA256.hexdigest(value)
      end
    end
  end
end
