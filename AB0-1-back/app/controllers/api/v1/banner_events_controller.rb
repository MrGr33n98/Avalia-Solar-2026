require 'uri'

module Api
  module V1
    class BannerEventsController < Api::V1::BaseController
      skip_before_action :authenticate_api_user, raise: false
      skip_before_action :verify_authenticity_token, raise: false

      ALLOWED_UTM_KEYS = %w[utm_source utm_medium utm_campaign utm_term utm_content gclid fbclid msclkid].freeze
      ALLOWED_METADATA_KEYS = %w[slot_key position page page_path category_id banner_id title link sponsored impression_instance_id click_instance_id].freeze

      def create
        event_params = params.require(:banner_event).permit(:banner_id, :company_id, :event_type, :tracked_at, utm: {},
                                                                                                               metadata: {})

        banner_id = event_params[:banner_id]
        event_type = event_params[:event_type].to_s
        company_id = event_params[:company_id]
        tracked_at = event_params[:tracked_at].presence || Time.current

        unless BannerEvent::EVENT_TYPES.include?(event_type)
          return render json: { error: 'invalid_event_type' }, status: :unprocessable_entity
        end

        ip_hash = safe_hash(request.remote_ip.to_s)
        ua_hash = safe_hash(request.user_agent.to_s)
        meta = sanitize_metadata(event_params[:metadata], banner_id)
        
        date_str = tracked_at.to_date.to_s
        position = meta['position'] || 'unknown'
        slot_key = meta['slot_key'] || 'unknown'
        
        # Include an instance_id if provided by the client, to avoid deduplicating 
        # multiple valid impressions/clicks from the same user/slot throughout the day.
        instance_id = meta['impression_instance_id'] || meta['click_instance_id'] || SecureRandom.uuid
        
        raw_key = "#{banner_id}:#{event_type}:#{date_str}:#{ip_hash}:#{ua_hash}:#{position}:#{slot_key}:#{instance_id}"
        event_key = Digest::SHA256.hexdigest(raw_key)

        begin
          BannerEvent.create_or_find_by!(event_key: event_key) do |e|
            e.banner_id = banner_id
            e.company_id = company_id
            e.event_type = event_type
            e.tracked_at = tracked_at
            e.ip_hash = ip_hash
            e.user_agent_hash = ua_hash
            e.referrer = sanitized_referrer
            e.utm_json = sanitize_utm(event_params[:utm])
            e.metadata_json = meta
            e.page_path = meta['page_path'] || meta['page']
            e.slot_key = slot_key
            e.placement = position
            
            # Save explicit UTMs for analytics
            utm_data = sanitize_utm(event_params[:utm])
            e.utm_source = utm_data['utm_source']
            e.utm_medium = utm_data['utm_medium']
            e.utm_campaign = utm_data['utm_campaign']
            e.utm_term = utm_data['utm_term']
            e.utm_content = utm_data['utm_content']
          end
        rescue ActiveRecord::RecordNotUnique
          # Idempotent success
        end

        render json: { status: 'ok' }, status: :created
      end

      private

      def sanitized_referrer
        return nil if request.referer.blank?

        uri = begin
          URI.parse(request.referer)
        rescue StandardError
          nil
        end
        uri&.host
      end

      def sanitize_utm(obj)
        return {} unless obj.is_a?(Hash)

        obj.stringify_keys.slice(*ALLOWED_UTM_KEYS).each_with_object({}) do |(key, val), acc|
          norm = normalize_value(val)
          acc[key] = norm if norm.present?
        end
      end

      def sanitize_metadata(obj, banner_id)
        return {} unless obj.is_a?(Hash)

        obj = obj.stringify_keys
        obj['banner_id'] ||= banner_id

        obj.slice(*ALLOWED_METADATA_KEYS).each_with_object({}) do |(key, val), acc|
          acc[key] = val if val.present?
        end
      end

      def normalize_value(value)
        value.to_s.downcase.strip.gsub(/[^a-z0-9_.-]/, '')[0, 255]
      end

      def safe_hash(value)
        return nil if value.blank?

        require 'digest'
        Digest::SHA256.hexdigest(value)
      end
    end
  end
end
