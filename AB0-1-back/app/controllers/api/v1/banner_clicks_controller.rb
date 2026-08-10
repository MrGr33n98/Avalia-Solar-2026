module Api
  module V1
    class BannerClicksController < BaseController
      skip_before_action :authenticate_api_user, raise: false
      skip_before_action :verify_authenticity_token, raise: false

      def show
        banner = Banner.currently_active.find(params[:id])
        destination = safe_destination(banner.link_url)
        destination = append_attribution_params(destination, banner)
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
      rescue StandardError => e
        report_click_error(e)
        raise
      end

      private

      def report_click_error(error)
        return unless defined?(Sentry)

        Sentry.capture_exception(error, tags: { component: 'banner_click_redirect' })
      rescue StandardError => reporting_error
        Rails.logger.warn("[BannerClicks] Sentry reporting failed: #{reporting_error.message}")
      end

      def safe_destination(value)
        return if value.blank?

        uri = URI.parse(value)
        return unless %w[http https].include?(uri.scheme&.downcase)
        return if uri.host.blank?

        uri.to_s
      end

      def append_attribution_params(destination, banner)
        return destination if destination.blank?

        uri = URI.parse(destination)
        params = URI.decode_www_form(uri.query.to_s)
        existing_keys = params.map(&:first).to_set
        attribution = {
          'utm_source' => 'avaliasolar_ads',
          'utm_medium' => 'banner',
          'utm_campaign' => "banner_#{banner.id}",
          'utm_content' => banner.position
        }
        attribution.each { |key, value| params << [key, value.to_s] unless existing_keys.include?(key) }
        uri.query = URI.encode_www_form(params)
        uri.to_s
      rescue URI::InvalidURIError
        destination
      end

      def safe_referrer
        return if request.referer.blank?

        URI.parse(request.referer).host
      rescue URI::InvalidURIError
        nil
      end

      def root_fallback
        '/'
      end
    end
  end
end
