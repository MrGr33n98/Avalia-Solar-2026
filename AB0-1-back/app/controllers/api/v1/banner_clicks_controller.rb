module Api
  module V1
    class BannerClicksController < BaseController
      skip_before_action :authenticate_api_user, raise: false
      skip_before_action :verify_authenticity_token, raise: false

      def show
        banner = Banner.currently_active.find(params[:id])
        destination = safe_destination(banner.link_url)
        return redirect_to root_fallback, status: :found, allow_other_host: true unless destination

        click_instance_id = params[:click_instance_id].to_s.presence || SecureRandom.uuid
        BannerEvent.create_or_find_by!(event_key: Digest::SHA256.hexdigest("#{banner.id}:click:#{click_instance_id}")) do |event|
          event.banner = banner
          event.company_id = banner.company_id
          event.event_type = 'click'
          event.tracked_at = Time.current
          event.click_instance_id = click_instance_id if event.respond_to?(:click_instance_id=)
          event.ip_hash = Digest::SHA256.hexdigest(request.remote_ip.to_s) if request.remote_ip.present?
          event.user_agent_hash = Digest::SHA256.hexdigest(request.user_agent.to_s) if request.user_agent.present?
          event.referrer = safe_referrer
          event.metadata_json = { 'source' => 'banner_redirect', 'position' => banner.position }
          event.placement = banner.position if event.respond_to?(:placement=)
        end

        redirect_to destination, allow_other_host: true
      rescue URI::InvalidURIError
        redirect_to root_fallback, status: :found, allow_other_host: true
      end

      private

      def safe_destination(value)
        return if value.blank?

        uri = URI.parse(value)
        return unless %w[http https].include?(uri.scheme&.downcase)
        return if uri.host.blank?

        uri.to_s
      end

      def safe_referrer
        return if request.referer.blank?

        URI.parse(request.referer).host
      rescue URI::InvalidURIError
        nil
      end

      def root_fallback
        ENV.fetch('FRONTEND_URL', '/')
      end
    end
  end
end
